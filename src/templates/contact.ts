export default (payload: any) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          color: black;
        }
    
        .email-container {
          width: 700px;
          margin: 20px auto;
          background-color: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
    
        .email-header {
          padding: 20px;
          text-align: left;
          background-color: #f9f9f9;
        }
    
        .email-body {
          padding: 20px;
          color: #333;
        }
    
        .email-body h1 {
          color: #ffcc00;
          font-size: 24px;
          display: flex;
          align-items: center;
        }
    
        .email-body h1::before {
          content: '⚠️';
          margin-right: 8px;
          font-size: 1.5em;
        }
    
        .email-body p {
          font-size: 16px;
          line-height: 1.5;
        }
    
        .email-body .stock-details {
          margin: 20px 0;
          padding: 15px;
          background-color: #f9f9f9;
          border-left: 4px solid #ffcc00;
        }
    
        .email-body .stock-details p {
          margin: 5px 0;
          font-size: 16px;
        }
    
        .email-footer {
          padding: 20px;
          background-color: #ff7043;
          color: white;
          text-align: center;
        }
    
        .email-footer p {
          margin: 10px 0;
          font-size: 14px;
        }
    
        .email-footer img {
          width: 30px;
          margin: 0 10px;
        }
    
        .email-footer .social-links {
          margin-top: 10px;
        }
          
        .email-body .button {
          display: inline-block;
          padding: 12px 20px;
          background-color: #ff7043;
          color: white;
          text-decoration: none;
          font-size: 16px;
          border-radius: 5px;
          margin-top: 20px;
        }
    
        .email-body .button:hover {
          background-color: #ff5722;
        }
        .welcome {
          text-align: center;
          gap: 10px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/Davaindia+logo+3.png" alt="DavaIndia Logo" width="150">
        </div>
    
        <div class="email-body">
          
          <p>Dear ${payload?.name},</p>

          <p>Thank you for reaching out to us! We've received your query and appreciate you taking the time to contact us.</p>

          <p><strong>Your Query: </strong>${payload?.message}</p>   
          
          <p>We're currently reviewing your request and will get back to you within 24-48 hours.
           In the meantime, if you need immediate assistance, please feel free to contact us at +91-8471 009 009.
          </p>

          <p>We are committed to providing you with the best support and will do our utmost to address your concerns promptly.</p>
          <p>If you have any additional details or questions in the meantime, don't hesitate to reply to this email.</p>
        </div>
    
        <div class="email-footer">
          <p>Thank you for choosing Davaindia</p>
    
          <div class="social-links">
            <a href="#"><img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/facebook.png" alt="Facebook"></a>
            <a href="#"><img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/twitter.png" alt="Twitter"></a>
            <a href="#"><img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/youtube.png" alt="YouTube"></a>
            <a href="#"><img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/behanch.png" alt="LinkedIn"></a>
          </div>
        </div>
      </div>
    </body>
    </html>
    
    
        `
}
