# 🚀 ENHANCED SPROUTCV DEPLOYMENT GUIDE

## Enterprise-Grade AI Resume Analysis Platform v2.0

This comprehensive guide will walk you through deploying the enhanced SproutCV platform with advanced features including Document AI, Vertex embeddings, semantic search, privacy protection, and event-driven architecture.

---

## 📋 **PREREQUISITES**

### **Required Accounts & Services**
- ✅ **Google Cloud Platform** (with billing enabled)
- ✅ **Supabase** (Pro plan recommended for production)
- ✅ **Vercel/Netlify** (for frontend deployment)
- ✅ **GitHub** (for code repository)

### **Required CLI Tools**
```bash
# Install required CLI tools
npm install -g @supabase/cli
npm install -g vercel
gcloud auth login
```

### **Minimum System Requirements**
- Node.js 18+ 
- PostgreSQL 15+ (via Supabase)
- 2GB RAM (development)
- 4GB RAM (production)

---

## 🔧 **STEP 1: GOOGLE CLOUD SETUP**

### **1.1 Create GCP Project**
```bash
# Create new project
gcloud projects create sproutcv-enhanced-prod --name="SproutCV Enhanced"

# Set as active project
gcloud config set project sproutcv-enhanced-prod

# Enable billing (required for AI services)
gcloud billing projects link sproutcv-enhanced-prod --billing-account=YOUR_BILLING_ACCOUNT
```

### **1.2 Enable Required APIs**
```bash
# Enable all required Google Cloud APIs
gcloud services enable documentai.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable dlp.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable storage-component.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable run.googleapis.com
```

### **1.3 Create Service Account**
```bash
# Create service account for SproutCV
gcloud iam service-accounts create sproutcv-service \
    --display-name="SproutCV Enhanced Service Account" \
    --description="Service account for SproutCV AI features"

# Grant necessary permissions
gcloud projects add-iam-policy-binding sproutcv-enhanced-prod \
    --member="serviceAccount:sproutcv-service@sproutcv-enhanced-prod.iam.gserviceaccount.com" \
    --role="roles/documentai.apiUser"

gcloud projects add-iam-policy-binding sproutcv-enhanced-prod \
    --member="serviceAccount:sproutcv-service@sproutcv-enhanced-prod.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding sproutcv-enhanced-prod \
    --member="serviceAccount:sproutcv-service@sproutcv-enhanced-prod.iam.gserviceaccount.com" \
    --role="roles/dlp.user"

gcloud projects add-iam-policy-binding sproutcv-enhanced-prod \
    --member="serviceAccount:sproutcv-service@sproutcv-enhanced-prod.iam.gserviceaccount.com" \
    --role="roles/pubsub.editor"

# Create and download service account key
gcloud iam service-accounts keys create sproutcv-service-key.json \
    --iam-account=sproutcv-service@sproutcv-enhanced-prod.iam.gserviceaccount.com
```

### **1.4 Setup Document AI Processors**
```bash
# Create Document AI processors for resume and job description parsing
gcloud documentai processors create \
    --location=us \
    --display-name="Resume Parser" \
    --type=FORM_PARSER_PROCESSOR

gcloud documentai processors create \
    --location=us \
    --display-name="Job Description Parser" \
    --type=FORM_PARSER_PROCESSOR

# Note the processor IDs from the output
```

### **1.5 Setup DLP for PII Protection**
```bash
# Create KMS key for data encryption
gcloud kms keyrings create sproutcv-keyring --location=global

gcloud kms keys create sproutcv-dlp-key \
    --location=global \
    --keyring=sproutcv-keyring \
    --purpose=encryption

# Get the key name for configuration
gcloud kms keys describe sproutcv-dlp-key \
    --location=global \
    --keyring=sproutcv-keyring
```

---

## 🗄️ **STEP 2: SUPABASE SETUP**

### **2.1 Create Supabase Project**
```bash
# Login to Supabase CLI
supabase login

# Initialize project
supabase init

# Link to existing project or create new one
supabase link --project-ref YOUR_PROJECT_REF
```

### **2.2 Deploy Enhanced Database Schema**
```bash
# Apply the enhanced database schema
supabase db push --file enhanced-database-schema.sql

# Verify schema deployment
supabase db diff
```

### **2.3 Setup Supabase Edge Functions**
```bash
# Deploy enhanced AI analyzer
supabase functions deploy enhanced-gemini-analyzer \
    --project-ref YOUR_PROJECT_REF

# Deploy event processor
supabase functions deploy event-processor \
    --project-ref YOUR_PROJECT_REF

# Verify deployments
supabase functions list
```

### **2.4 Configure Environment Variables**
Create `.env.local` file:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=sproutcv-enhanced-prod
GOOGLE_APPLICATION_CREDENTIALS=./sproutcv-service-key.json
RESUME_PROCESSOR_ID=your_resume_processor_id
JD_PROCESSOR_ID=your_jd_processor_id
DLP_CRYPTO_KEY_NAME=projects/sproutcv-enhanced-prod/locations/global/keyRings/sproutcv-keyring/cryptoKeys/sproutcv-dlp-key
DLP_WRAPPED_KEY=your_wrapped_key

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

---

## 🚀 **STEP 3: APPLICATION DEPLOYMENT**

### **3.1 Install Dependencies**
```bash
# Copy enhanced package.json
cp package-enhanced.json package.json

# Install all dependencies
npm install

# Verify installation
npm audit
```

### **3.2 Build Application**
```bash
# Type check
npm run type-check

# Build for production
npm run build

# Test build locally
npm start
```

### **3.3 Deploy to Vercel**
```bash
# Login to Vercel
vercel login

# Deploy application
vercel --prod

# Configure environment variables in Vercel dashboard
```

### **3.4 Setup Custom Domain (Optional)**
```bash
# Add custom domain in Vercel dashboard
# Configure DNS records
# Setup SSL certificate (automatic with Vercel)
```

---

## 🔄 **STEP 4: EVENT-DRIVEN ARCHITECTURE SETUP**

### **4.1 Create Pub/Sub Topics**
```bash
# Create topics for event-driven processing
gcloud pubsub topics create document-uploaded
gcloud pubsub topics create analysis-requested
gcloud pubsub topics create optimization-requested
gcloud pubsub topics create processing-completed
gcloud pubsub topics create processing-failed

# Create subscriptions
gcloud pubsub subscriptions create document-processing-sub \
    --topic=document-uploaded

gcloud pubsub subscriptions create analysis-processing-sub \
    --topic=analysis-requested

gcloud pubsub subscriptions create optimization-processing-sub \
    --topic=optimization-requested
```

### **4.2 Configure Cloud Run for Event Processing**
```bash
# Deploy event processor to Cloud Run
gcloud run deploy sproutcv-event-processor \
    --source=./supabase/functions/event-processor \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --memory=2Gi \
    --cpu=2 \
    --timeout=600 \
    --max-instances=10
```

### **4.3 Setup Event Triggers**
```bash
# Create Cloud Function to trigger on Pub/Sub messages
gcloud functions deploy process-document-events \
    --runtime=nodejs18 \
    --trigger-topic=document-uploaded \
    --entry-point=processDocumentEvent \
    --memory=1GB \
    --timeout=540s
```

---

## 🔒 **STEP 5: SECURITY & MONITORING**

### **5.1 Setup Security Policies**
```bash
# Configure IAM policies for least privilege access
gcloud projects add-iam-policy-binding sproutcv-enhanced-prod \
    --member="serviceAccount:sproutcv-service@sproutcv-enhanced-prod.iam.gserviceaccount.com" \
    --role="roles/monitoring.metricWriter"

# Setup VPC and firewall rules (if needed)
gcloud compute networks create sproutcv-vpc --subnet-mode=regional
```

### **5.2 Configure Monitoring**
```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Create monitoring dashboard
gcloud alpha monitoring dashboards create --config-from-file=monitoring-config.yaml
```

### **5.3 Setup Alerts**
```bash
# Create alerting policies for critical metrics
gcloud alpha monitoring policies create --policy-from-file=alerting-policy.yaml
```

---

## 🧪 **STEP 6: TESTING & VALIDATION**

### **6.1 Run Test Suite**
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

### **6.2 Load Testing**
```bash
# Install load testing tools
npm install -g artillery

# Run load tests
artillery run load-test-config.yml
```

### **6.3 Validate AI Features**
```bash
# Test Document AI parsing
curl -X POST "https://your-app.vercel.app/api/test-document-ai" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test Vertex embeddings
curl -X POST "https://your-app.vercel.app/api/test-embeddings" \
  -H "Content-Type: application/json" \
  -d '{"text": "Software Engineer with 5 years experience"}'

# Test semantic search
curl -X POST "https://your-app.vercel.app/api/test-semantic-search" \
  -H "Content-Type: application/json" \
  -d '{"query": "Python developer"}'
```

---

## 📊 **STEP 7: PERFORMANCE OPTIMIZATION**

### **7.1 Database Optimization**
```sql
-- Run in Supabase SQL editor
-- Optimize vector indexes
CREATE INDEX CONCURRENTLY idx_embeddings_performance 
ON document_embeddings USING hnsw (embedding vector_cosine_ops) 
WITH (m = 32, ef_construction = 128);

-- Analyze table statistics
ANALYZE document_embeddings;
ANALYZE enhanced_documents;
ANALYZE enhanced_analyses;
```

### **7.2 CDN Configuration**
```bash
# Configure CDN for static assets
# Setup in Vercel dashboard:
# - Enable Edge Network
# - Configure caching headers
# - Setup image optimization
```

### **7.3 Caching Strategy**
```bash
# Configure Redis for caching (optional)
# Setup in your cloud provider:
# - Analysis result caching
# - Embedding caching
# - Session caching
```

---

## 🔍 **STEP 8: MONITORING & ANALYTICS**

### **8.1 Application Monitoring**
```bash
# Setup application performance monitoring
# Configure in your APM tool of choice:
# - Error tracking
# - Performance monitoring
# - User analytics
```

### **8.2 AI Model Monitoring**
```bash
# Monitor AI model performance
# Track in Google Cloud Console:
# - API usage and costs
# - Response times
# - Error rates
# - Accuracy metrics
```

### **8.3 Business Metrics**
```sql
-- Create analytics views in Supabase
CREATE VIEW daily_usage_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_analyses,
    AVG(overall_score) as avg_score,
    COUNT(DISTINCT user_id) as unique_users
FROM enhanced_analyses
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🛠️ **STEP 9: MAINTENANCE & UPDATES**

### **9.1 Automated Backups**
```bash
# Setup automated database backups
# Configure in Supabase dashboard:
# - Daily backups
# - Point-in-time recovery
# - Cross-region replication
```

### **9.2 Update Procedures**
```bash
# Database migrations
supabase db push --dry-run
supabase db push

# Function updates
supabase functions deploy enhanced-gemini-analyzer --no-verify-jwt
supabase functions deploy event-processor --no-verify-jwt

# Application updates
npm run build
vercel --prod
```

### **9.3 Health Checks**
```bash
# Create health check endpoints
curl -f "https://your-app.vercel.app/api/health" || exit 1
curl -f "https://your-project.supabase.co/rest/v1/" || exit 1
```

---

## 🚨 **TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions**

#### **Document AI Errors**
```bash
# Check processor status
gcloud documentai processors list --location=us

# Verify permissions
gcloud auth application-default print-access-token
```

#### **Vertex AI Errors**
```bash
# Check API quotas
gcloud compute project-info describe --project=sproutcv-enhanced-prod

# Verify model access
gcloud ai models list --region=us-central1
```

#### **Database Connection Issues**
```bash
# Test Supabase connection
supabase status
supabase db ping
```

#### **Performance Issues**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

## 📈 **COST OPTIMIZATION**

### **Expected Monthly Costs (Production)**
- **Google Cloud AI Services**: $200-500
- **Supabase Pro**: $25
- **Vercel Pro**: $20
- **Cloud Storage**: $10-50
- **Monitoring**: $20-50

### **Cost Optimization Tips**
1. **Use caching** to reduce AI API calls
2. **Implement request batching** for embeddings
3. **Monitor usage** and set billing alerts
4. **Use preemptible instances** for batch processing
5. **Optimize database queries** to reduce compute

---

## 🎯 **SUCCESS METRICS**

### **Technical KPIs**
- ✅ **Response Time**: <30 seconds for analysis
- ✅ **Availability**: 99.9% uptime
- ✅ **Error Rate**: <1% of requests
- ✅ **Vector Search**: <50ms query time

### **Business KPIs**
- ✅ **User Engagement**: >80% completion rate
- ✅ **Analysis Accuracy**: >95% user satisfaction
- ✅ **ATS Score Improvement**: >20% average increase
- ✅ **Feature Adoption**: >60% advanced feature usage

---

## 🔗 **HELPFUL RESOURCES**

### **Documentation Links**
- [Google Cloud Document AI](https://cloud.google.com/document-ai/docs)
- [Vertex AI Embeddings](https://cloud.google.com/vertex-ai/docs/embeddings)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### **Monitoring Dashboards**
- [Google Cloud Console](https://console.cloud.google.com)
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Analytics](https://vercel.com/analytics)

### **Support Channels**
- Technical Issues: Create GitHub issue
- Feature Requests: Product roadmap
- Security Issues: security@sproutcv.com

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] Google Cloud project created and configured
- [ ] All APIs enabled with proper quotas
- [ ] Service accounts and IAM policies set
- [ ] Supabase project setup with enhanced schema
- [ ] Environment variables configured
- [ ] Dependencies installed and tested

### **Deployment**
- [ ] Database schema deployed successfully
- [ ] Edge functions deployed and tested
- [ ] Frontend application deployed
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Monitoring and alerts configured
- [ ] Performance benchmarks met
- [ ] Security scanning completed
- [ ] Backup procedures tested
- [ ] Documentation updated

### **Go-Live**
- [ ] DNS propagation complete
- [ ] All integrations tested
- [ ] Support team briefed
- [ ] Incident response plan ready
- [ ] Success metrics tracking active

---

**🎉 Congratulations! Your enhanced SproutCV platform is now live with enterprise-grade AI features!**

For ongoing support and updates, please refer to the maintenance section and monitoring dashboards.
