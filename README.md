# MacTidar-Cloud-Storage

Team cloud file storage: Next.js on AWS Amplify, files in S3, metadata in DynamoDB, sign-in with Cognito. Infrastructure is managed with Terraform.

- [Architecture & data model](docs/architecture.md)
- [Design system](DESIGN.md) · [Google Stitch prompts](docs/stitch-prompts.md)

## Layout
```
src/            Next.js app (App Router, API route handlers)
infra/          Terraform (one environment)
docs/           Architecture and design docs
amplify.yml     Amplify build settings
```

## Local development
```bash
npm install
cp .env.example .env.local   # fill in from `terraform -chdir=infra output env`
npm run dev
```
Locally, the app uses your own AWS CLI credentials to reach the Cape Town (af-south-1) services.

## First deployment
1. **Enable the Cape Town region** in the AWS account: Account → AWS Regions → Africa (Cape Town) → Enable. It can take a few minutes.
2. **Create the Terraform state bucket** (once):
   ```bash
   terraform -chdir=infra/bootstrap init
   terraform -chdir=infra/bootstrap apply
   ```
3. **Connect GitHub to Amplify:**
   - Install the AWS Amplify GitHub App for eu-west-1 on this repository: https://github.com/apps/aws-amplify-eu-west-1/installations/new
   - Create a classic personal access token with only the `admin:repo_hook` scope. Amplify uses it once to create the app and doesn't store it, so you can delete it after the first apply.
   - Then:
   ```bash
   export TF_VAR_github_access_token=ghp_...
   cp infra/terraform.tfvars.example infra/terraform.tfvars   # set alert_email
   ```
4. **Apply:**
   ```bash
   terraform -chdir=infra init
   terraform -chdir=infra apply
   ```
5. **Delegate `cloud.zetca.com` from Namecheap:** in Namecheap → zetca.com → Advanced DNS, add 4 `NS` records with host `cloud`, one for each value in `terraform -chdir=infra output name_servers`. The certificate and email records then verify on their own (can take up to an hour).
6. **Cost alerts:** in Billing → Cost allocation tags, activate the `Project` tag so the `mactidar-monthly` budget can track this project's spend.

After that, every push to `master` is built and deployed by Amplify.
