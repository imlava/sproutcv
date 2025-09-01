import { supabase } from '@/integrations/supabase/client';
import { QuotaExceededError, RateLimitError, QuotaInfo } from '@/types/analysis';

export class QuotaManager {
  private static readonly RATE_LIMIT = 10; // requests per minute
  private static readonly DAILY_QUOTA = 100; // analyses per day
  private static readonly FREE_TIER_QUOTA = 5; // free analyses per month

  async checkQuota(userId: string): Promise<void> {
    // Check daily quota using existing resume_analyses table
    const dailyUsage = await this.getDailyUsage(userId);
    if (dailyUsage >= QuotaManager.DAILY_QUOTA) {
      throw new QuotaExceededError('daily');
    }

    // Check user's subscription quota
    const userQuota = await this.getUserQuota(userId);
    if (userQuota.remaining <= 0) {
      throw new QuotaExceededError('monthly');
    }

    // Check rate limits using security_events table
    await this.checkRateLimit(userId);
  }

  async getUserQuota(userId: string): Promise<QuotaInfo> {
    try {
      // Get user profile to check subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, credits')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to fetch user quota information');
      }

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Get current month usage using existing resume_analyses table
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
      // Use the existing consume_analysis_credit function
      const { error } = await supabase.rpc('consume_analysis_credit', {
        target_user_id: userId,
        analysis_id: crypto.randomUUID()
      });

      if (error) {
        console.error('Error decrementing quota:', error);
      }

    } catch (error) {
      console.error('Quota decrement failed:', error);
    }
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    try {
      // Count requests in the last minute using resume_analyses table
      const { count, error } = await supabase
        .from('resume_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
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
        .from('resume_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
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
        .from('resume_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
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
        .from('resume_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
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
}