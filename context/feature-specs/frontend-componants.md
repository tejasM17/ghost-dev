# Component Reference

Clerk offers a comprehensive suite of components designed to seamlessly integrate authentication and multi-tenancy into your application. With Clerk components, you can easily customize the appearance of authentication components and pages, manage the entire authentication flow to suit your specific needs, and even build robust SaaS applications.

## Authentication components

- [<SignIn />](https://clerk.com/docs/nextjs/reference/components/authentication/sign-in.md)
- [<SignUp />](https://clerk.com/docs/nextjs/reference/components/authentication/sign-up.md)
- [<GoogleOneTap />](https://clerk.com/docs/nextjs/reference/components/authentication/google-one-tap.md)
- [<OAuthConsent />](https://clerk.com/docs/nextjs/reference/components/authentication/oauth-consent.md)
- [<TaskChooseOrganization />](https://clerk.com/docs/nextjs/reference/components/authentication/task-choose-organization.md)
- [<TaskResetPassword />](https://clerk.com/docs/nextjs/reference/components/authentication/task-reset-password.md)
- [<TaskSetupMFA />](https://clerk.com/docs/nextjs/reference/components/authentication/task-setup-mfa.md)
- [<Waitlist />](https://clerk.com/docs/nextjs/reference/components/authentication/waitlist.md)

## User components

- [<UserAvatar />](https://clerk.com/docs/nextjs/reference/components/user/user-avatar.md)
- [<UserButton />](https://clerk.com/docs/nextjs/reference/components/user/user-button.md)
- [<UserProfile />](https://clerk.com/docs/nextjs/reference/components/user/user-profile.md)

## Organization components

- [<CreateOrganization />](https://clerk.com/docs/nextjs/reference/components/organization/create-organization.md)
- [<OrganizationProfile />](https://clerk.com/docs/nextjs/reference/components/organization/organization-profile.md)
- [<OrganizationSwitcher />](https://clerk.com/docs/nextjs/reference/components/organization/organization-switcher.md)
- [<OrganizationList />](https://clerk.com/docs/nextjs/reference/components/organization/organization-list.md)

## Billing components

- [<PricingTable />](https://clerk.com/docs/nextjs/reference/components/billing/pricing-table.md)
- [<CheckoutButton />](https://clerk.com/docs/nextjs/reference/components/billing/checkout-button.md)
- [<PlanDetailsButton />](https://clerk.com/docs/nextjs/reference/components/billing/plan-details-button.md)
- [<SubscriptionDetailsButton />](https://clerk.com/docs/nextjs/reference/components/billing/subscription-details-button.md)

## Control components

Control components manage authentication-related behaviors in your application. They handle tasks such as controlling content visibility based on user authentication status, managing loading states during authentication processes, and redirecting users to appropriate pages. Control components render at `<Loading />` and `<Loaded />` states for assertions on the [Clerk object](https://clerk.com/docs/nextjs/reference/objects/clerk.md). A common example is the [<Show />](https://clerk.com/docs/nextjs/reference/components/control/show.md) component, which allows you to conditionally render content based on authentication and authorization state.

- [<AuthenticateWithRedirectCallback />](https://clerk.com/docs/nextjs/reference/components/control/authenticate-with-redirect-callback.md)
- [<ClerkDegraded />](https://clerk.com/docs/nextjs/reference/components/control/clerk-degraded.md)
- [<ClerkFailed />](https://clerk.com/docs/nextjs/reference/components/control/clerk-failed.md)
- [<ClerkLoaded />](https://clerk.com/docs/nextjs/reference/components/control/clerk-loaded.md)
- [<ClerkLoading />](https://clerk.com/docs/nextjs/reference/components/control/clerk-loading.md)
- [<RedirectToCreateOrganization />](https://clerk.com/docs/nextjs/reference/components/control/redirect-to-create-organization.md)
- [<RedirectToOrganizationProfile />](https://clerk.com/docs/nextjs/reference/components/control/redirect-to-organization-profile.md)
- [<RedirectToSignIn />](https://clerk.com/docs/nextjs/reference/components/control/redirect-to-sign-in.md)
- [<RedirectToSignUp />](https://clerk.com/docs/nextjs/reference/components/control/redirect-to-sign-up.md)
- [<RedirectToTasks />](https://clerk.com/docs/nextjs/reference/components/control/redirect-to-tasks.md)
- [<RedirectToUserProfile />](https://clerk.com/docs/nextjs/reference/components/control/redirect-to-user-profile.md)
- [<Show />](https://clerk.com/docs/nextjs/reference/components/control/show.md)

## Unstyled components

- [<SignInButton />](https://clerk.com/docs/nextjs/reference/components/unstyled/sign-in-button.md)
- [<SignInWithMetamaskButton />](https://clerk.com/docs/nextjs/reference/components/unstyled/sign-in-with-metamask.md)
- [<SignUpButton />](https://clerk.com/docs/nextjs/reference/components/unstyled/sign-up-button.md)
- [<SignOutButton />](https://clerk.com/docs/nextjs/reference/components/unstyled/sign-out-button.md)

## Utilities components

- [<UNSAFE\_PortalProvider />](https://clerk.com/docs/nextjs/reference/components/utilities/portal-provider.md)

## Customization guides

- [Customize components with the appearance prop](https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/overview.md)
- [Localize components with the `localization` prop (experimental)](https://clerk.com/docs/guides/customizing-clerk/localization.md)
- [Add pages to the <UserProfile /> component](https://clerk.com/docs/nextjs/guides/customizing-clerk/adding-items/user-profile.md)
- [Add pages to the <OrganizationProfile /> component](https://clerk.com/docs/nextjs/guides/customizing-clerk/adding-items/organization-profile.md)

### Secured by Clerk branding

> This feature requires a [paid plan](https://clerk.com/pricing){{ target: '_blank' }} for production use, but all features are free to use in development mode so that you can try out what works for you. See the [pricing](https://clerk.com/pricing){{ target: '_blank' }} page for more information.

By default, Clerk displays a **Secured by Clerk** badge on Clerk components. You can remove this branding by following these steps:

1. In the Clerk Dashboard, navigate to your application's [**Settings**](https://dashboard.clerk.com/~/settings).
2. Under **Branding**, toggle on the **Remove "Secured by Clerk" branding** option.
 
- [Need help?](https://clerk.com/contact/support): Contact the support team to get answers to your questions.
