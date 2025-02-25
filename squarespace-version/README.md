# JustMath Squarespace Integration Guide

## Setup Instructions

1. **Deploy the Backend API**
   - Deploy the Node.js server (from the `server` directory) to a cloud platform
   - Update the `API_URL` in `config.js` with your deployed API URL

2. **Upload Images to Squarespace**
   - Go to your Squarespace dashboard
   - Navigate to Design → Custom CSS
   - Upload all images from the `images` directory to Squarespace's asset manager
   - Update the `IMAGE_URL` in `config.js` with your Squarespace site's CDN URL

3. **Add Custom Code to Squarespace**
   - Go to your Squarespace dashboard
   - Navigate to Settings → Advanced → Code Injection
   - Add the following to the Header section:
     ```html
     <script src="/config.js"></script>
     <link rel="stylesheet" href="/styles.css">
     ```
   - Add the following to the Footer section:
     ```html
     <script src="/script.js"></script>
     ```

4. **Create a New Page**
   - Create a new page in Squarespace
   - Add a "Code" block
   - Paste the contents of `index.html` into the Code block
   - Save and publish

5. **Add Custom CSS**
   - Go to Design → Custom CSS
   - Paste the contents of `styles.css`
   - Save

## File Structure
- `config.js` - Configuration settings
- `script.js` - Main application logic
- `styles.css` - Custom styles
- `index.html` - Main HTML template

## Important Notes
1. Make sure your API endpoint (backend) is properly secured with CORS settings
2. Test the integration thoroughly in Squarespace's preview mode before publishing
3. Keep your API keys and sensitive data in your backend environment variables
4. Regular backups of your custom code are recommended

## Troubleshooting
1. If images don't load, verify the Squarespace CDN URL in config.js
2. If API calls fail, check the CORS settings in your backend
3. For any CSS conflicts, you may need to add more specific selectors

## Updates and Maintenance
1. To update the application:
   - Make changes to the relevant files
   - Test in preview mode
   - Update the VERSION in config.js
   - Republish the page

## Support
For technical support or questions about the integration, contact your development team or Squarespace support.
