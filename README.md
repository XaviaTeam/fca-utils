# facebook.js
A NodeJS package to interact with Facebook Messenger API (fca-unofficial) 


# Installation
```bash
npm install facebook.js
```

# Basic Usage
```js
import { MSGStore } from 'facebook.js'

const store = new MSGStore();

store.loginWithAppState(appState).then(() => {
    console.log('Logged in!');
});
```

Comming soon...
