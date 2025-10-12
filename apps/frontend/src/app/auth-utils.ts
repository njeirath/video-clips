import { getCurrentUser, signOut } from 'aws-amplify/auth';

export async function isUserSignedIn() {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export async function signOutUser() {
  await signOut();
}
