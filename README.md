# PDF Text Processor with Cloudflare Workers AI

## Overview
This Next.js application allows you to upload PDF files, extract their text content, and process the text using Cloudflare Workers AI to generate insights and summaries.

## Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Cloudflare Account with Workers AI access

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/pdf-llm-parser.git
cd pdf-llm-parser
```

2. Install dependencies
```bash
npm install
```

3. Configure Cloudflare credentials
- Rename `env.local` to `.env.local`
- Replace the following values with your actual Cloudflare credentials:
  - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
  - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Workers AI access

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features
- PDF file upload
- Text extraction from multi-page PDFs
- AI-powered text summarization using Cloudflare Workers AI
- Modern, responsive UI

## Technologies
- Next.js
- TypeScript
- Tailwind CSS
- PDF.js
- Cloudflare Workers AI

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss proposed changes.

## License
[MIT](https://choosealicense.com/licenses/mit/)
