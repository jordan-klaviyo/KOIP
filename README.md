# Team KOIP Hackathon project

## Installation

- Install zrok
- Reserve a hostname `zrok reserve localhost:8082` (or whatever port you want forwarded)
- Check out the `hackathon-KOIP` branch for `app` and `k-repo` (it just removes auth from some endpoints)
- Copy `.env.example` to `.env` and set environment variables
- Run app `cd ~/Klaviyo/Repos/app && make up && make run-server` and k-repo chat service `cd ~/Klaviyo/Repos/k-repo && pants run "$HOME/Klaviyo/Repos/k-repo/python/klaviyo/natural_language_interface/chat/server:local`
- Finally, `yarn start`
