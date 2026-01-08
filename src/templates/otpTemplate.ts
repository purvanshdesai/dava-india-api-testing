export default (otp: any) => {
  return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your OTP Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
              color: #333;
            }
  
            .email-container {
              width: 700px;
              margin: 20px auto;
              background-color: #fff;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
  
            .email-header {
              padding: 20px;
              background-color: #f9f9f9;
              text-align: left;
            }
  
            .email-body {
              padding: 30px 20px;
              text-align: center;
            }
  
            .email-body h2 {
              font-size: 22px;
              margin-bottom: 10px;
              color: #ff7043;
            }
  
            .otp-code {
              font-size: 40px;
              font-weight: bold;
              color: #ffcc00;
              margin: 20px 0;
              letter-spacing: 4px;
            }
  
            .email-body p {
              font-size: 16px;
              margin: 10px 0;
              line-height: 1.6;
            }
  
            .email-footer {
              padding: 20px;
              background-color: #ff7043;
              color: white;
              text-align: center;
            }
  
            .email-footer .social-links img {
              width: 30px;
              margin: 0 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <img
                src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/Davaindia+logo+3.png"
                alt="DavaIndia Logo"
                width="150"
              />
            </div>
            <div class="email-body">
              <h2>Your One-Time Password (OTP)</h2>
              <p>Use the following OTP to proceed with your verification:</p>
              <div class="otp-code">${otp}</div>
              <p>This OTP is valid for the next <strong>2 minutes</strong>.</p>
              <p>Please do not share this code with anyone for security reasons.</p>
              <p>If you did not request this, you can safely ignore this email.</p>
            </div>
            <div class="email-footer">
              <p>Thank you for choosing Davaindia</p>
              <div class="social-links">
                <a href="#"><img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/facebook.png" alt="Facebook" /></a>
                <a href="#"><img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/twitter.png" alt="Twitter" /></a>
                <a href="#"><img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/youtube.png" alt="YouTube" /></a>
                <a href="#"><img src="https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/behanch.png" alt="LinkedIn" /></a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
}
