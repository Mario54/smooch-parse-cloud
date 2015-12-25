# Smooch Cloud Code Module

Smooch itself does not offer a way to authenticate users (passwords are not stored in the database). Therefore you need to your own backend in order to have user authentication.

Parse.com offers a backend as a service for mobile, desktop, and embedded devices. With it you don't need to worry about maintaining your own backend.

Using Parse with Smooch is an easy way to get started building apps without having to get lost in the multitudes of ways to build a backend.

Sign up for [Parse](parse.com) and [Smooch](smooch.io), and start implementing your cool idea.

## How it Works
This Cloud Code module offers a way to easily:
- Generate JWTs needed to securely interact with Smooch's REST API
- Share Parse user properties with Smooch user properties

You will have to add the code in this repo to your Parse Cloud Code application. If you don't already have a Parse Cloud Code  application, follow the instructions [here](https://parse.com/docs/cloudcode/guide#command-line) to create one.

# Adding the Smooch Cloud Code Module

To use Parse with Smooch, you will have to add this module to your Cloud Code application.

A cloud code application is structured this way:
```
 |- public
 |- cloud
    |- main.js
```

To add the Smooch Cloud Code module, you will first have to open your terminal and navigate to the `cloud` directory of your Cloud Code project and clone this repository:
`$ cd cloud`
`$ git clone ...`

Now, the Smooch Cloud module is added to your Cloud Code application. To use the module, you will have to modify the entry point of your application, `main.js`.

```javascript
```

After adding the Smooch Cloud Code module to your application and modifying the `main.js` file, you can deploy the application:
`$ parse deploy`

You can now use Smooch with your Parse app. User properties changed in Parse will be updated in Smooch, and you can generate a JWT by calling the `generateJWT` function that we defined in your Cloud Code application.

# Using Parse with Smooch in your iOS, Android or JavaScript app

Calling the function to sign the JWT from your iOS, Android or JavaScript is done through the respective [Parse SDK](https://parse.com/docs). All the SDKs provide a way to call the Cloud Code function that was defined in the last section, `generateJWT`. The function we added needs to be called after a user is logged in using a Parse SDK. Examples are given for how to use it for the Android, iOS and JavaScript SDK.

### Android

```android
public class MainActivity extends ActionBarActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);
      ParseLoginBuilder builder = new ParseLoginBuilder(MainActivity.this);
      startActivityForResult(builder.build(), 0);


  }

protected void onActivityResult (int requestCode, int resultCode, Intent data) {
	  if (resultCode == RESULT_OK) {
		ParseCloud.callFunctionInBackground("generateJWT", null, new FunctionCallback() {
		      public void done(Object object, ParseException e) {
		        if (e == null) {
					// use object
				 	Smooch.login(userId, jwt);
		        } else {
		          	// handle error...
		        }
		      }
		});
	  }
  }

}

```

### iOS


### JavaScript
