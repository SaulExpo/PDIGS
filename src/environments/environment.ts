const defaultEnvironment = {
  production: false,
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  },
  googleMapsApiKey: ""
};

export const environment = (window as any).__env
  ? {...defaultEnvironment, ...(window as any).__env}
  : defaultEnvironment;
