export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // This function should be called from within a component that has access to the user
  // The user token should be passed as a parameter or obtained differently
  
  // For now, we'll make a basic fetch request
  // The actual authentication will be handled by the component calling this function
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
} 