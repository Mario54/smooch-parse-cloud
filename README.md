# Smooch Cloud Code Module

[Smooch](https://smooch.io) is the best way to have personal, rich conversations with your customers online or in your mobile app. In addition to awesome integrations, it provides easy-to-setup SDKs for iOS, Android and JavaScript as well as a REST API. 

Since Smooch itself doesn't offer a way to authenticate users, you need your own backend in order to implement user authentication (i.e. login).

[Parse](https://parse.com) is a good solution to this problem since it provides dead simple user management (authorization, authentication, sessions, etc.) as well as database services for mobile, desktop, and embedded devices. By using Parse, you don't need to worry about creating and maintaining your own backend. It's perfect for quickly implementing your cool idea or if you don't need a complex backend.

Parse also offers Cloud Code, a platform to run arbitrary code to augment your Parse application which the module in this repository is built for.

To get started, you will need a [Parse](https://parse.com) and [Smooch](https://smooch.io) account.

Below is a guide for how to use the Smooch Cloud Code module
- [Adding the Smooch module to your Cloud Code application](#adding-the-smooch-cloud-code-module)
- [Using Parse and Smooch in your app](#using-parse-and-smooch-in-your-app)

## Why use this module?
The Smooch Cloud Code module offers a way to easily:
- Generate JWTs needed to securely interact with Smooch's SDKs and REST API
- Share Parse user properties with Smooch user properties

Going forward, it is assumed that you already have a Parse Cloud Code application. If you don't have one, follow the instructions [here](https://parse.com/docs/cloudcode/guide#command-line) to create one.

## Adding the Smooch Cloud Code Module
A Cloud Code application is structured this way:
```
 |- public
 |- cloud
    |- main.js
```

To add the Smooch Cloud Code module, you will first have to open your terminal and navigate to the `cloud` directory of your Cloud Code application, and then clone this repository by running the commands below.
```
$ cd cloud
$ git clone git@github.com:Mario54/smooch-parse-cloud.git smooch
```

Now, the Smooch module is added to your Cloud Code application. Your Parse Cloud Code application should look like this:
```
 |- public
 |- cloud
	|- smooch
		|- lib
		|- smooch.js
	|- main.js
```

To use the `smooch/smooch.js` module, you have to modify the entry point of your application, `main.js`. First, add the code below to `require` the `smooch.js` file, and pass in your Smooch key id and secret used to sign JWTs. You can get the `Key Id` and `Secret` from the Settings tab of the [Smooch dashboard](https://app.smooch.io).

```javascript
// main.js
var Smooch = require('cloud/smooch/smooch.js');

var keyId = '<smooch-key-id>';
var secret = '<smooch-secret-key>';

Smooch.setOptions({
  keyId: keyId,
  secret: secret
});
```

### The `generateJWT` function

Then, define a new Cloud Code function called `generateJWT` to easily sign Smooch-compatible JWTs from any Parse SDK. You will notice that the `generateJWT` function assumes that a user is logged in.

```javascript
Parse.Cloud.define("generateJWT", function(request, response) {
  if (!request.user) {
    return void response.error("No authenticated user");
  }

  response.success(Smooch.withParseUser(request.user).getJWT());
});
```

### Syncing Parse User properties with Smooch

We will also add a hook that will trigger when a Parse User is modified. When run, it will use the Parse User's properties to update the associated `appUser` in Smooch with any new properties. The `.update` function calls the `/:appUser/update` endpoint of the Smooch REST API. Accordingly, the object returned by `mapToSmoochProperties` needs to adhere to arguments [expected by the endpoint](http://docs.smooch.io/rest/#update). Note that Smooch expects [a flat object in the properties key](http://docs.smooch.io/rest/#update) of the `appUser`.

```javascript
function mapToSmoochProperties(parseUser) {
  return {
    email: parseUser.get('email'),
    givenName: parseUser.get('name'),
    properties: {
      emailVerified: parseUser.get('emailVerified')
      /// ...
    }
  };
}

Parse.Cloud.afterSave(Parse.User, function(request, response) {
  Smooch.withParseUser(request.object)
  	.update(mapToSmoochProperties);
});
```

The `mapToSmoochProperties` function can be customized as you want. The `.update` function expects the `mapToSmoochProperties` to return a normal object (as shown above) or a `Parse.Promise` that is resolved to an object.

### Deploying Your Parse Code Cloud Application
After adding the Smooch Cloud Code module to your application and modifying the `main.js` file, you can deploy the application:
```
$ parse deploy
```

You can now use Smooch with your Parse app. User properties changed in Parse will be updated in Smooch automatically, and you can generate a valid Smooch JWT by calling the `generateJWT` function that defined in the `main.js` file of your Cloud Code application.

### Customization

#### Smooch's userId
By default, the Smooch Cloud Code module uses the Parse Users's `ObjectId` as the Smooch `userId`. You can specify a different key to use when calling `setOptions`. For example, if you want to use the user's email as the Smooch `userId`
```javascript
Smooch.setOptions({
    keyId: ...,
    secretKey: ...,
    userIdKey: 'email'
});
```

#### `mapToSmoochProperties` function
The `mapToSmoochProperties` can be customized for your Parse setup. For example, if you have a `age` column in your Parse User class, you include it in Smooch's properties:
```javascript
function mapToSmoochProperties(parseUser) {
  return {
    email: parseUser.get('email'),
    givenName: parseUser.get('name'),
    properties: {
      age: parseUser.get('age')
    }
  };
}
```

You can also return a `Parse.Promise` in the function. This means you can query some Parse class related to the User class to add properties to the Smooch user. For example, if you have a `Purchase` class that stores user purchases, you could query the number of purchases made by the user to store it in the Smooch user.
```javascript
function mapToSmoochProperties(parseUser) {
  return new Parse.Query('Purchase')
    .equalTo('purchaser', parseUser)
    .count()
    .then(function(numOfPurchases) {
      return {
        email: parseUser.get('email'),
        givenName: parseUser.get('name'),
        properties: {
          age: parseUser.get('age'),
          numberOfPurchases: numOfPurchases
        }
      };
    });
}
```

## Using Parse and Smooch in your app

To use Parse in combination with Smooch, you first need to login using one of the Parse SDK. Then, you can call the `generateJWT` function to get a valid Smooch JWT. All the SDKs provide a way to call the Cloud Code function. After the JWT is generated, you can pass it to a Smooch SDK to securely initialize a session with Smooch.

Examples are given for how to use it for the Android, iOS and JavaScript SDK.
- [Android](#android)
- [iOS](#ios)
- [JavaScript](#javascript)

### Android
*You first need to add the [Smooch](http://docs.smooch.io/android/#adding-smooch-to-your-app) and [Parse](https://parse.com/apps/quickstart#parse_data/mobile/android/native/existing) SDK to your Android app.*

If you're using [user interface provided by Parse](https://parse.com/docs/android/guide#user-interface) you will need to generate the JWT in the `onActivityResult` result callback (see below if you're not using Parse's user interface). After calling the `generateJWT` Code Cloud function, you can now login to the Smooch SDK using `Smooch.login(userId, jwt)`. After the `.login` to Smooch, you can start the `ConversationActivity` to show the conversation interface to the user.

```java
public class MainActivity extends ActionBarActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);
      ParseLoginBuilder builder = new ParseLoginBuilder(MainActivity.this);
      startActivityForResult(builder.build(), 0);
  }

  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
	  if (resultCode == RESULT_OK) {
		  Map<String, String> emptyMap = new HashMap<>();

		  ParseCloud.callFunctionInBackground("generateJWT", emptyMap, new FunctionCallback<String>() {
			  public void done(String jwt, ParseException e) {
				  if (e == null) {
					  String userId = ParseUser.getCurrentUser().getObjectId();
					  Smooch.login(userId, jwt);
					  ConversationActivity.show(MainActivity.this);
				  } else {
					  // handle error...
				  }
			  }
		  });
	  }
  }
}
```

If you're not using Parse's user interface, you'll need to call the `generateJWT` function in the `logIn` callback.

```java
ParseUser.logInInBackground("Jerry", "showmethemoney", new LogInCallback() {
  public void done(ParseUser user, ParseException e) {
    if (user != null) {
		Map<String, String> emptyMap = new HashMap<>();

		ParseCloud.callFunctionInBackground("generateJWT", emptyMap, new FunctionCallback<String>() {
			public void done(String jwt, ParseException e) {
				if (e == null) {
					String userId = ParseUser.getCurrentUser().getObjectId();
					Smooch.login(userId, jwt);
					ConversationActivity.show(MainActivity.this);
				} else {
					// handle error...
				}
			}
		});
    } else {
      // Login failed. Look at the ParseException to see what happened.
    }
  }
});
```

### iOS
*You first need to add the [Smooch](http://docs.smooch.io/ios/#adding-smooch-to-your-app) and [Parse](https://parse.com/apps/quickstart#parse_data/mobile/ios/native/existing) SDK to your iOS app.*

If you're using [user interface provided by Parse](https://parse.com/docs/ios/guide#user-interface) you will need to generate the JWT in the `- (void)logInViewController:(PFLogInViewController *)logInController didLogInUser:(PFUser *)user` delegate (see below if you're not using Parse's user interface). After calling the `generateJWT` Code Cloud function, you can now login to the Smooch SDK using `[Smooch login:userId jwt:jwt)]`. After the `login` to Smooch, you can show the conversation interface using `[Smooch show]`.

```objective-c
#import <Parse/Parse.h>
#import <ParseUI/ParseUI.h>
#import <Smooch/Smooch.h>

#import "ViewController.h"

@interface ViewController () <PFLogInViewControllerDelegate>

@property UITextField* eventField;

@property UIButton* button;
@property UIButton* eventButton;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    self.button = [[UIButton alloc] initWithFrame:CGRectMake(0, 270, self.view.bounds.size.width, 30)];
    [self.button addTarget:self action:@selector(loginTaped) forControlEvents:UIControlEventTouchUpInside];
    [self.button setTitle:@"Login" forState:UIControlStateNormal];
    self.button.backgroundColor = [UIColor blackColor];
    [self.view addSubview:self.button];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)loginTaped {
    PFLogInViewController *logInController = [[PFLogInViewController alloc] init];
    logInController.delegate = self;
    [self presentViewController:logInController animated:YES completion:nil];

}

- (void)logInViewController:(PFLogInViewController *)logInController didLogInUser:(PFUser *)user {
    [PFCloud callFunctionInBackground:@"generateJWT" withParameters:@{} block:^(NSString *jwt, NSError *error) {
        if (!error)
        {
            NSString *userId = [PFUser currentUser].objectId;
            [Smooch login:userId jwt:jwt];
            [self dismissViewControllerAnimated:YES completion:^() {
                [Smooch show];
            }];
        }
    }];
}

- (void)logInViewControllerDidCancelLogIn:(PFLogInViewController *)logInController {
    // user cancelled...
}

@end

```

If you're not using Parse UI, you simply have to call the Cloud Code function after the Parse login:

```objective-c
[PFUser logInWithUsernameInBackground:@"myname" password:@"mypass"
  block:^(PFUser *user, NSError *error) {
    if (user) {
		[PFCloud callFunctionInBackground:@"generateJWT" withParameters:@{} block:^(NSString *jwt, NSError *error) {
			if (!error)
			{
				NSString *userId = [PFUser currentUser].objectId;
				[Smooch login:userId jwt:jwt];
			}
		}];
    } else {
      // The login failed. Check error to see why.
    }
}];
```

Then, you can call `[Smooch show]` to show the conversation interface.


### JavaScript

*You will first need to add the [Smooch](http://docs.smooch.io/javascript/#adding-smooch-to-your-site) and [Parse](https://parse.com/apps/quickstart#parse_data/web/existing) SDK to your JavaScript app.*

```javascript
Parse.User.logIn("myname", "mypass")
	.then(function(user) {
		Parse.Cloud.run('generateJWT')
			.then(function (res) {
				return Smooch.init({
					appToken: '<app-token-here>',
					jwt: res,
					userId: userId
				});
		});
	}, function(user, error) {
    	// The login failed. Check error to see why.
	});
```
