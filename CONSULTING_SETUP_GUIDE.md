# Gradual Consulting Setup Guide

This guide explains how to configure the "Book a call" and "Send us a message" functionality for the Gradual Consulting microsite.

## 1. Calendly Integration (Book a Call)

### Current Setup
The "Book a call" button on the contact page opens your Calendly booking page in a new tab.

### How to Connect Your Calendly

1. **Get your Calendly URL:**
   - Log into your Calendly account
   - Go to your event type (e.g., "10-minute fit check")
   - Copy the public booking link (e.g., `https://calendly.com/your-username/event-name`)

2. **Add to Environment Variables:**
   - Open your `.env.local` file (or create it if it doesn't exist)
   - Add the following line:
     ```
     NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-username/event-name
     ```
   - Replace `your-username/event-name` with your actual Calendly link

3. **Restart your development server:**
   - The environment variable will be loaded on server restart

### Where It's Used
- Contact page (`/consulting/contact`) - "Book a call" button
- All "Book a call" buttons in the navbar
- All CTA sections across consulting pages

## 2. Contact Form (Send us a message)

### Current Setup
The contact form submits to `/api/consulting-lead` which:
- Validates the form data
- Saves the lead to Firestore in the `consultingLeads` collection
- Returns a success response

### How It Works

**Form Submission Flow:**
1. User fills out the form (name, email, track, message)
2. Form submits to `/api/consulting-lead` API route
3. Data is validated
4. Lead is saved to Firestore collection: `consultingLeads`
5. User sees success message

**Data Structure Saved:**
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  track: "high-school" | "university" | "not-sure",
  message: "User's message...",
  submittedAt: "2025-01-XX...",
  status: "new",
  source: "consulting-contact-form"
}
```

### Viewing Submissions

**Option 1: Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Open the `consultingLeads` collection
5. View all submitted leads

**Option 2: Set up Email Notifications (Optional)**

To receive email notifications when someone submits the form, you can:

1. **Use an Email Service** (e.g., Resend, SendGrid, Nodemailer)
2. **Update the API route** (`src/app/api/consulting-lead/route.ts`)
3. **Add email sending code** in the TODO section

Example with Resend:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'consulting@gradual.com',
  to: process.env.CONSULTING_EMAIL || 'your-email@gradual.com',
  subject: `New Consulting Lead: ${name}`,
  html: `
    <h2>New Consulting Lead</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Track:</strong> ${track}</p>
    <p><strong>Message:</strong> ${message}</p>
  `
});
```

### Email Configuration

**If you want email notifications:**
1. Choose an email service (Resend, SendGrid, etc.)
2. Get an API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=your_api_key_here
   CONSULTING_EMAIL=consulting@gradual.com
   ```
4. Update the API route to send emails (see example above)

**If you don't want email notifications:**
- The form will still work and save to Firestore
- You can check submissions in the Firebase Console
- Or set up a dashboard to view leads later

## 3. Quick Setup Checklist

- [ ] Add `NEXT_PUBLIC_CALENDLY_URL` to `.env.local` with your Calendly link
- [ ] Verify Firestore is configured (should already be set up)
- [ ] Test the contact form submission
- [ ] Check Firebase Console to see if leads are being saved
- [ ] (Optional) Set up email notifications if desired

## 4. Testing

1. **Test Calendly:**
   - Click "Book a call" button
   - Should open your Calendly page in a new tab

2. **Test Contact Form:**
   - Fill out and submit the form
   - Check browser console for any errors
   - Check Firebase Console → Firestore → `consultingLeads` collection
   - Should see the new lead document

## 5. Troubleshooting

**Calendly not opening:**
- Check that `NEXT_PUBLIC_CALENDLY_URL` is set correctly in `.env.local`
- Restart your development server after adding the env variable
- Verify the URL is correct (should start with `https://calendly.com/`)

**Form not submitting:**
- Check browser console for errors
- Verify Firestore is properly configured
- Check that the API route is accessible at `/api/consulting-lead`
- Ensure all required fields are filled

**Leads not appearing in Firestore:**
- Check Firebase Console for errors
- Verify Firestore rules allow writes to `consultingLeads` collection
- Check server logs for any error messages

## 6. Firestore Security Rules

Make sure your Firestore rules allow writes to the `consultingLeads` collection. Example:

```javascript
match /consultingLeads/{leadId} {
  allow create: if request.auth == null; // Allow anonymous submissions
  allow read: if request.auth != null; // Only authenticated users can read
}
```


