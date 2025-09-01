import { supabase } from '@/integrations/supabase/client';
import { QuotaExceededError, RateLimitError, QuotaInfo } from '@/types/analysis';

export class QuotaManager {
  private static readonly RATE_LIMIT = 10; // requests per minute
  private static readonly DAILY_QUOTA = 100; // analyses per day
  private static readonly FREE_TIER_QUOTA = 5; // free analyses per month

  async checkQuota(userId: string): Promise<void> {
    // Check daily quota
    const dailyUsage = await this.getDailyUsage(userId);
    if (dailyUsage >= QuotaManager.DAILY_QUOTA) {
      throw new QuotaExceededError('daily');
    }

    // Check user's subscription quota
    const userQuota = await this.getUserQuota(userId);
    if (userQuota.remaining <= 0) {
      throw new QuotaExceededError('monthly');
    }

    // Check rate limits
    await this.checkRateLimit(userId);
  }

  async getUserQuota(userId: string): Promise<QuotaInfo> {
    try {
      // Get user profile to check subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, credits')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to fetch user quota information');
      }

      // Get current month usage
      const monthlyUsage = await this.getMonthlyUsage(userId);
      
      // Determine quota based on subscription tier
      let totalQuota = QuotaManager.FREE_TIER_QUOTA;
      
      switch (profile.subscription_tier) {
        case 'pro':
          totalQuota = 100;
          break;
        case 'premium':
          totalQuota = 500;
          break;
        case 'enterprise':
          totalQuota = 1000;
          break;
        default:
          totalQuota = profile.credits || QuotaManager.FREE_TIER_QUOTA;
      }

      const remaining = Math.max(0, totalQuota - monthlyUsage);
      const resetDate = this.getNextResetDate();

      return {
        remaining,
        total: totalQuota,
        resetDate: resetDate.toISOString(),
        rateLimitRemaining: await this.getRateLimitRemaining(userId)
      };

    } catch (error) {
      console.error('Error checking user quota:', error);
      throw new Error('Failed to check quota');
    }
  }

  async decrementQuota(userId: string): Promise<void> {
    try {
      // Record the usage
      const { error } = await supabase
        .from('quota_usage')
        .insert([{
          user_id: userId,
          usage_type: 'analysis',
          usage_count: 1,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error recording quota usage:', error);
      }

      // Also decrement credits if using credit-based system
      await this.decrementCredits(userId);

    } catch (error) {
      console.error('Error decrementing quota:', error);
    }
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    try {
      // Count requests in the last minute
      const { count, error } = await supabase
        .from('quota_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('usage_type', 'analysis')
        .gte('created_at', oneMinuteAgo.toISOString());

      if (error) {
        console.error('Error checking rate limit:', error);
        return; // Don't block on rate limit check errors
      }

      if (count && count >= QuotaManager.RATE_LIMIT) {
        const resetTime = new Date(now.getTime() + 60 * 1000);
        throw new RateLimitError(resetTime.toISOString());
      }

    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      console.error('Rate limit check failed:', error);
      // Don't block on rate limit failures
    }
  }

  private async getDailyUsage(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const { count, error } = await supabase
        .from('quota_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('usage_type', 'analysis')
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Error fetching daily usage:', error);
        return 0;
      }

      return count || 0;

    } catch (error) {
      console.error('Daily usage check failed:', error);
      return 0;
    }
  }

  private async getMonthlyUsage(userId: string): Promise<number> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    try {
      const { count, error } = await supabase
        .from('quota_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('usage_type', 'analysis')
        .gte('created_at', firstOfMonth.toISOString());

      if (error) {
        console.error('Error fetching monthly usage:', error);
        return 0;
      }

      return count || 0;

    } catch (error) {
      console.error('Monthly usage check failed:', error);
      return 0;
    }
  }

  private async getRateLimitRemaining(userId: string): Promise<number> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    try {
      const { count, error } = await supabase
        .from('quota_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('usage_type', 'analysis')
        .gte('created_at', oneMinuteAgo.toISOString());

      if (error) {
        console.error('Error checking rate limit remaining:', error);
        return QuotaManager.RATE_LIMIT;
      }

      return Math.max(0, QuotaManager.RATE_LIMIT - (count || 0));

    } catch (error) {
      console.error('Rate limit remaining check failed:', error);
      return QuotaManager.RATE_LIMIT;
    }
  }

  private async decrementCredits(userId: string): Promise<void> {
    try {
      // Use the existing update_user_credits function
      const { error } = await supabase.rpc('consume_analysis_credit', {
        target_user_id: userId,
        analysis_id: crypto.randomUUID()
      });

      if (error) {
        console.error('Error decrementing credits:', error);
      }

    } catch (error) {
      console.error('Credit decrement failed:', error);
    }
  }

  private getNextResetDate(): Date {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  }

  // Public utility methods
  async getQuotaStatus(userId: string): Promise<{
    daily: { used: number; limit: number; remaining: number };
    monthly: QuotaInfo;
    rateLimit: { remaining: number; resetTime: Date };
  }> {
    const dailyUsage = await this.getDailyUsage(userId);
    const monthlyQuota = await this.getUserQuota(userId);
    const rateLimitRemaining = await this.getRateLimitRemaining(userId);

    return {
      daily: {
        used: dailyUsage,
        limit: QuotaManager.DAILY_QUOTA,
        remaining: Math.max(0, QuotaManager.DAILY_QUOTA - dailyUsage)
      },
      monthly: monthlyQuota,
      rateLimit: {
        remaining: rateLimitRemaining,
        resetTime: new Date(Date.now() + 60 * 1000)
      }
    };
  }

  // Admin method to reset quotas
  async resetUserQuota(userId: string, adminUserId: string): Promise<void> {
    try {
      // Log admin action
      const { error } = await supabase
        .from('admin_actions')
        .insert([{
          admin_user_id: adminUserId,
          target_user_id: userId,
          action_type: 'quota_reset',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error logging admin action:', error);
      }

      // Reset quota by clearing usage records for current month
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      await supabase
        .from('quota_usage')
        .delete()
        .eq('user_id', userId)
        .gte('created_at', firstOfMonth.toISOString());

    } catch (error) {
      console.error('Quota reset failed:', error);
      throw new Error('Failed to reset user quota');
    }
  }
}