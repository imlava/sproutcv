# Payment System Test Configuration

## Setup Instructions

The payment system test tool requires Supabase configuration to function. You have several options:

### Option 1: JavaScript Config File (Recommended)

1. Copy `config.example.js` to `config.js`
2. Update the values with your Supabase credentials:

```javascript
window.SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

### Option 2: JSON Config File

1. Copy `config.example.json` to `config.json`
2. Update the values with your Supabase credentials:

```json
{
  "supabase": {
    "url": "https://your-project.supabase.co",
    "anonKey": "your-anon-key-here"
  }
}
```

### Option 3: Runtime Prompts

If no config files are found, the tool will prompt you to enter the credentials manually.

## Security Notes

- **Never commit `config.js` or `config.json` to version control**
- These files are already added to `.gitignore`
- Only include example files in the repository
- Use environment-specific configurations for different deployments

## Finding Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon/public" key

## Usage

Once configured, open `payment-system-test.html` in your browser to access the testing interface.
