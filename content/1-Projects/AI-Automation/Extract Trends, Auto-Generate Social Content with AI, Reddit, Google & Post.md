---
created: 2025-08-05 15:37
tags:
  - zet
  - important
Due Date: 2025-08-06
---
#### Tuesday, August 05, 2025
---
# Extract Trends and Auto-Generate Social Media Content with OpenAI, Reddit, and Google Trends: Approve and Post to Instagram, TikTok, and More

---
## Description

### What Problem Does This Solve? 🛠️

This workflow automates **trend extraction** and **social media content creation** for businesses and marketers. It eliminates manual trend research and content generation by fetching trends, scoring them with AI, and posting tailored content to multiple platforms. **Target audience**: Social media managers, digital marketers, and businesses aiming to streamline content strategies.

### What Does It Do? 🌟

- Fetches trending topics from Reddit, X and Google Trends
- Scores trends for relevance using OpenAI.
- Generates content for Twitter/X, LinkedIn, Instagram and Facebook
- Posts to supported platforms
- Stores results in Google Sheets for tracking

### Key Features 📋

- Real-time trend fetching from Reddit and Google Trends.
- AI-driven trend scoring and content generation (OpenAI).
- Automated posting to Twitter/X, LinkedIn, Instagram, and Facebook.
- Persistent storage in Google Sheets.

---

## Setup Instructions

### Prerequisites ⚙️

- **n8n Instance**: Self-hosted or cloud n8n instance.
- **API Credentials**:
    - **Reddit API**: Client ID and secret from Reddit.
    - **SerpApi (Google Trends)**: API key from SerpApi, stored in n8n credentials
    - **OpenAI API**: API key with GPT model access.
    - **Twitter/X API**: OAuth 1.0a credentials with write permissions.
    - **LinkedIn API**: OAuth 2.0 credentials with `w_organization_social` scope.
    - **Instagram/Facebook API**: Meta Developer app with posting permissions.
    - **Google Sheets API**: Credentials from Google Cloud Console.

### Installation Steps 📦

1. **Import the Workflow**:
    - Copy the workflow JSON from the "Template Code" section below.
    - Import it into n8n via "Import from File" or "Import from URL".
2. **Configure Credentials**:
    - Add API credentials in n8n’s Credentials section for Reddit, SerpApi, OpenAI, Twitter/X, LinkedIn, Instagram/Facebook, and Google Sheets.
    - Assign credentials to respective nodes. For example:
        - In the `Fetch Google Trends` node (HTTP Request), use n8n credentials for SerpApi instead of hardcoding the API key.
        - Example: Set the API key in n8n credentials as `SerpApiKey` and reference it in the node’s query parameter: `api_key={{ $credentials.SerpApiKey }}`.
3. **Set Up Google Sheets** with the following columns (exact column names are case-sensitive)  
    -Timestamp | Trend | Score | BrandVoice | AudienceMood |
4. **Customize Nodes**:

- **OpenAI Nodes** (`Trend Relevance Scoring`, `Generate Social Media Content`): Update the model (e.g., `gpt-4o`) and prompt as needed.
- **HTTP Request Nodes** (`Post to Twitter/X`, `Post to LinkedIn`, etc.): Verify URLs, authentication, and payloads.
- **Brand Voice/Audience Mood**: Adjust `Prepare Trend Scoring Input` for your desired `brand_voice` (e.g., "casual") and `audience_mood` (e.g., "curious").

1. **Test the Workflow**:

- `Fetch Reddit Trends` to `Store Selected Trends`- to score and store trends.
- `Retrieve Latest Trends` to end) to generate and post content
- Check Google Sheets for posting statuses