# WhatsApp Automation Setup Guide

This guide will help you set up WhatsApp automation using MSG91 for your Insurance CRM system.

## Prerequisites

1. **MSG91 Account**: Sign up at [MSG91](https://msg91.com/)
2. **WhatsApp Business Account**: Connected to MSG91
3. **Approved WhatsApp Templates**: Templates must be approved by WhatsApp

## WhatsApp Templates

You need to create and get approval for these templates in your MSG91 dashboard:

### 1. Birthday Wish Template
- **Template Name**: `birthday_wish`
- **Category**: Utility
- **Language**: English
- **Content**:
```
🎉 Happy Birthday {{1}} ! 🎂

Wishing you a wonderful year filled with good health, happiness, peace of mind, and financial success. May the coming year bring stability, growth, and confidence in achieving all your personal and financial goals.

Thank you for trusting us with your financial planning. We look forward to continuing our association and supporting you in building a secure and prosperous future.

Warm regards,
Amit Ulhe
Authorized Financial Planner
```

### 2. Policy Renewal Template
- **Template Name**: `policy_renewal`
- **Category**: Utility
- **Language**: English
- **Content**:
```
Hello {{1}} ,

This is a gentle reminder that your {{2}} policy (Policy No: {{3}} ) with {{4}} is due for renewal.

Policy Expiry Date: {{5}}
Premium Amount: ₹{{6}}

To ensure uninterrupted coverage and continued benefits, please complete the renewal before the expiry date.

If you need any assistance or clarification, feel free to reach out.

Warm regards,
Amit Ulhe
Authorized Financial Planner
```

## Environment Configuration

Add these variables to your `backend/.env` file:

```env
# MSG91 WhatsApp Configuration
MSG91_AUTH_KEY="your-msg91-auth-key"
MSG91_INTEGRATED_NUMBER="918208691655"
MSG91_NAMESPACE="2be3d7b5_0eea_40c4_bea6_4ea50f3dee92"
```

### Getting Your MSG91 Credentials

1. **AUTH_KEY**: Found in your MSG91 dashboard under API Keys
2. **INTEGRATED_NUMBER**: Your WhatsApp Business number registered with MSG91
3. **NAMESPACE**: Found in your MSG91 WhatsApp template section

## Database Setup

1. **Run Prisma Migration**:
```bash
cd backend
npx prisma db push
```

2. **Setup WhatsApp Templates**:
```bash
npm run setup-whatsapp-templates
# or
npx ts-node src/scripts/setupWhatsAppTemplates.ts
```

## Features

### Automated WhatsApp Messages

The system automatically sends WhatsApp messages for:

1. **Birthday Wishes**: Sent at 9:00 AM IST on client/lead birthdays
2. **Policy Renewal Reminders**: Sent 30 days before policy expiry

### Manual Triggers

You can manually trigger WhatsApp messages from the dashboard:

- Send birthday wishes immediately
- Send renewal reminders for upcoming policies
- Send custom messages using approved templates

### Scheduling

- **Automatic**: Daily at 9:00 AM IST via GitHub Actions/Vercel Cron
- **Manual**: Trigger from the dashboard anytime
- **API**: Use REST endpoints for custom integrations

## API Endpoints

### WhatsApp Automation Endpoints

```
GET  /api/whatsapp-automation/dashboard     # Dashboard data
GET  /api/whatsapp-automation/logs          # Message logs
GET  /api/whatsapp-automation/stats         # Statistics
POST /api/whatsapp-automation/send-birthday-wishes
POST /api/whatsapp-automation/send-renewal-reminders
POST /api/whatsapp-automation/send-custom-message
```

### Frontend API Routes

```
GET  /api/whatsapp-automation/dashboard
POST /api/whatsapp-automation/send-birthday-wishes
POST /api/whatsapp-automation/send-renewal-reminders
```

## Dashboard Features

### Combined Automation Dashboard

Access the new combined dashboard at `/dashboard/automation` which includes:

1. **Statistics Cards**: Email and WhatsApp message counts
2. **Manual Actions**: Send messages via both channels
3. **Upcoming Events**: Birthdays and renewals with contact preferences
4. **Message History**: Separate tabs for email and WhatsApp logs

### Contact Preferences

The system automatically detects available contact methods:
- 📧 Email icon for clients/leads with email addresses
- 💬 WhatsApp icon for clients/leads with WhatsApp numbers
- Sends via both channels if both are available

## Data Requirements

### Client Data
- `whatsappNumber`: WhatsApp number (with country code)
- `dateOfBirth`: For birthday automation
- `email`: For email automation (optional)

### Lead Data
- `whatsappNumber`: WhatsApp number (with country code)
- `dateOfBirth`: For birthday automation
- `email`: For email automation (optional)

## Testing

### Test WhatsApp Integration

1. **Manual Test**:
```bash
# Test birthday wish
curl -X POST http://localhost:5000/api/whatsapp-automation/send-birthday-wishes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test renewal reminder
curl -X POST http://localhost:5000/api/whatsapp-automation/send-renewal-reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysBefore": 30}'
```

2. **Dashboard Test**: Use the manual action buttons in the automation dashboard

3. **Cron Test**: Trigger the automation endpoint manually

## Monitoring

### Logs and Analytics

- **WhatsApp Logs**: Track all sent messages with status
- **Error Handling**: Failed messages logged with error details
- **Statistics**: Success rates, message counts by type
- **MSG91 Integration**: Message IDs for tracking delivery

### Status Tracking

- `PENDING`: Message queued for sending
- `SENT`: Successfully sent to MSG91
- `FAILED`: Failed to send (with error message)
- `DELIVERED`: Delivered to recipient (if supported by MSG91)
- `READ`: Read by recipient (if supported by MSG91)

## Troubleshooting

### Common Issues

1. **Template Not Found**:
   - Ensure templates are approved in MSG91 dashboard
   - Check template names match exactly
   - Verify namespace is correct

2. **Authentication Failed**:
   - Check MSG91_AUTH_KEY is correct
   - Ensure API key has WhatsApp permissions

3. **Invalid Phone Number**:
   - Phone numbers must include country code
   - Format: +919876543210 or 919876543210

4. **Message Failed**:
   - Check WhatsApp number is registered with WhatsApp
   - Verify template parameters are correct
   - Check MSG91 account balance

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

## Security

- All API endpoints require authentication
- Cron endpoints protected with secret tokens
- Phone numbers and personal data encrypted in logs
- Rate limiting applied to prevent abuse

## Cost Optimization

- Duplicate prevention: Won't send same message twice in 24 hours
- Batch processing: Efficient API calls to MSG91
- Error handling: Prevents unnecessary retries
- Smart scheduling: Only processes active policies and valid contacts

## Support

For issues with:
- **MSG91 Integration**: Contact MSG91 support
- **WhatsApp Templates**: Check WhatsApp Business API documentation
- **System Issues**: Check application logs and error messages

## Next Steps

1. Set up MSG91 account and get templates approved
2. Configure environment variables
3. Run database migrations
4. Test with a small group of contacts
5. Monitor logs and adjust as needed
6. Scale to full automation

The WhatsApp automation system is now integrated with your existing email automation, providing a comprehensive communication solution for your Insurance CRM.