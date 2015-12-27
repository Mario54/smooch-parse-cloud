# Smooch Cloud Code Module

Smooch itself doesn't offer a way to authenticate users. Therefore you need your own backend in order to have user authentication (i.e. login).

Parse.com offers a backend as a service for mobile, desktop, and embedded devices. With it you don't need to worry about creating and maintaining your own backend. It's perfect for implementing your cool idea quickly.

You need a [Parse](https://parse.com) and [Smooch](https://smooch.io) account to get started.

## Why use this module?
This Cloud Code module offers a way to easily:
- Generate JWTs needed to securely interact with Smooch's REST API
- Share Parse user properties with Smooch user properties

You will have to add the code in this repo to your Parse Cloud Code application. If you don't already have a Parse Cloud Code application, follow the instructions [here](https://parse.com/docs/cloudcode/guide#command-line) to create one.

## Adding the Smooch Cloud Code Module
To use Parse with Smooch, you will have to add this module to your Cloud Code application.

A cloud code application is structured this way:
```
 |- public
 |- cloud
    |- main.js
```

To add the Smooch Cloud Code module, you will first have to open your terminal and navigate to the `cloud` directory of your Cloud Code project, and then clone this repository:
```
$ cd cloud`
$ git clone git@github.com:Mario54/smooch-parse-cloud.git
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

To use the `smooch/smooch.js` module, you will have to modify the entry point of your application, `main.js`.

```javascript
// main.js
var Smooch = require('cloud/smooch/smooch.js');

var kid = '<smooch-key-id>';
var secretKey = '<smooch-secret-key>';

Smooch.setOptions({
  kid: kid,
  secretKey: secretKey
});

Parse.Cloud.define("generateJWT", function(request, response) {
  if (!request.user) {
    return void response.error("No authenticated user");
  }

  response.success(Smooch.setParseUser(request.user).getJWT());
});

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
  Smooch.setParseUser(request.object).update(mapToSmoochProperties)
    .then(function() {
      response.success('user updated');
    });
});
```

After adding the Smooch Cloud Code module to your application and modifying the `main.js` file, you can deploy the application:
```
$ parse deploy
```

You can now use Smooch with your Parse app. User properties changed in Parse will be updated in Smooch automatically, and you can generate a valid Smooch JWT by calling the `generateJWT` function that defined in the `main.js` file of your Cloud Code application.

## Using Parse and Smooch in your app

To use Parse in combination with Smooch, you first need to login using one of the Parse SDK. Then, you can call the `generateJWT` function to get a valid Smooch JWT. All the SDKs provide a way to call the Cloud Code function. Keep in mind, the `generateJWT` function needs to be called after a user is logged in using a Parse SDK. After the JWT is generated, you can pass it to a Smooch SDK to securely interact with Smooch. Examples are given for how to use it for the Android, iOS and JavaScript SDK.

### Android
You first need to add the [Smooch](http://docs.smooch.io/android/#adding-smooch-to-your-app) and [Parse](https://parse.com/apps/quickstart#parse_data/mobile/android/native/existing) SDK to your app.

If you're using user interface provided by Parse you will need to generate the JWT in the `onActivityResult` result callback (see below if you're not using Parse's user interface). After calling the `generateJWT` Code Cloud function, you can now login to the Smooch SDK using `Smooch.login(userId, jwt)`. After the `.login` to Smooch, you can start the `ConversationActivity` to show the conversation interface to the user.

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
You first need to add the [Smooch](http://docs.smooch.io/ios/#adding-smooch-to-your-app) and [Parse](https://parse.com/apps/quickstart#parse_data/mobile/ios/native/existing) SDK to your app.

If you're using user interface provided by Parse you will need to generate the JWT in the `- (void)logInViewController:(PFLogInViewController *)logInController didLogInUser:(PFUser *)user` delegate (see below if you're not using Parse's user interface). After calling the `generateJWT` Code Cloud function, you can now login to the Smooch SDK using `[Smooch login:userId jwt:jwt)]`. After the `login` to Smooch, you can show the conversation interface using `[Smooch show]`.

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

You will first need to add the [Smooch](http://docs.smooch.io/javascript/#adding-smooch-to-your-site) and [Parse](https://parse.com/apps/quickstart#parse_data/web/existing) SDK to your app.

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
