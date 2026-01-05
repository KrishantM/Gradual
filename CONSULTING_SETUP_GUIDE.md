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
- **Sends an email notification to admin@gradual.co.nz**
- Returns a success response

### How It Works

**Form Submission Flow:**
1. User fills out the form (name, email, track, message)
2. Form submits to `/api/consulting-lead` API route
3. Data is validated
4. Lead is saved to Firestore collection: `consultingLeads`
5. **Email is sent to admin@gradual.co.nz with all form details**
6. User sees success message

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

### Email Notifications

**Email Service: Resend**
The form automatically sends a formatted email to `admin@gradual.co.nz` when someone submits the contact form. The email includes:
- Sender's name and email (reply-to is set to the sender's email)
- Selected track
- Full message content
- Professional HTML formatting

**Setup Required:**
1. **Create a Resend account** (if you don't have one):
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account (100 emails/day free tier)
   - Verify your domain or use their test domain for development

2. **Get your API key:**
   - Go to API Keys in your Resend dashboard
   - Create a new API key
   - Copy the key

3. **Add to Environment Variables:**
   - Open your `.env.local` file (or create it if it doesn't exist)
   - Add the following lines:
     ```
     RESEND_API_KEY=re_your_api_key_here
     RESEND_FROM_EMAIL=noreply@gradual.co.nz
     ```
   - Replace `re_your_api_key_here` with your actual Resend API key
   - Replace `noreply@gradual.co.nz` with your verified email address (or leave it out to use Resend's test domain for development)

4. **Restart your development server:**
   - The environment variable will be loaded on server restart

**Email Configuration:**
- **From address:** `Gradual Consulting <noreply@gradual.co.nz>`
  - You'll need to verify the `gradual.co.nz` domain in Resend, OR
  - Use Resend's test domain for development: `onboarding@resend.dev`
- **To address:** `admin@gradual.co.nz` (hardcoded)
- **Reply-to:** Set to the sender's email address (so you can reply directly)

**Note:** If the email fails to send (e.g., missing API key), the form submission will still succeed and save to Firestore. Email errors are logged but don't block the form submission.

### Viewing Submissions

**Option 1: Email Notifications**
- You'll receive an email at `admin@gradual.co.nz` for each submission
- You can reply directly to the email to respond to the sender

**Option 2: Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Open the `consultingLeads` collection
5. View all submitted leads

## 3. Quick Setup Checklist

- [ ] Add `NEXT_PUBLIC_CALENDLY_URL` to `.env.local` with your Calendly link
- [ ] Create a Resend account and get your API key
- [ ] Add `RESEND_API_KEY` to `.env.local` with your Resend API key
- [ ] Verify your domain in Resend (or use test domain for development)
- [ ] Verify Firestore is configured (should already be set up)
- [ ] Test the contact form submission
- [ ] Check that email is received at admin@gradual.co.nz
- [ ] Check Firebase Console to see if leads are being saved

## 4. Testing

1. **Test Calendly:**
   - Click "Book a call" button
   - Should open your Calendly page in a new tab

2. **Test Contact Form:**
   - Fill out and submit the form
   - Check browser console for any errors
   - Check your email at admin@gradual.co.nz for the notification
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

**Email not being received:**
- Verify `RESEND_API_KEY` is set correctly in `.env.local`
- Check that you've restarted your development server after adding the env variable
- Verify your domain is verified in Resend (or use test domain for development)
- Check server logs for email sending errors
- Note: Email failures don't block form submission - check Firestore to confirm the lead was saved

## 6. Firestore Security Rules

Make sure your Firestore rules allow writes to the `consultingLeads` collection. Example:

```javascript
match /consultingLeads/{leadId} {
  allow create: if request.auth == null; // Allow anonymous submissions
  allow read: if request.auth != null; // Only authenticated users can read
}
```


