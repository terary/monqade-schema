# Monqade #

# Monqade Schema #

## Lightweight Mongoose/MongoDB interface.



## Requirements ##
* [PHP 5.4.0 or higher](http://www.php.net/)

## Developer Documentation ##
http://terarychambers.com/docs/monqade/monqade-schema/

## Git Repo ##
https://github.com/terary/monqade-schema

## Installation ##

```npm install monqade-schema```

### Download the Release



## Examples ##
See the [`examples/`](examples) directory for examples of the key client features. You can
view them in your browser by running the php built-in web server.

```
$ php -S localhost:8000 -t examples/
```

And then browsing to the host and port you specified
(in the above example, `http://localhost:8000`).

### Basic Example ###

```php
// include your composer dependencies
require_once 'vendor/autoload.php';

$client = new Google_Client();
$client->setApplicationName("Client_Library_Examples");
$client->setDeveloperKey("YOUR_APP_KEY");

$service = new Google_Service_Books($client);
$optParams = array('filter' => 'free-ebooks');
$results = $service->volumes->listVolumes('Henry David Thoreau', $optParams);

foreach ($results as $item) {
  echo $item['volumeInfo']['title'], "<br /> \n";
}
```


## Code Quality ##

Run the PHPUnit tests with PHPUnit. You can configure an API key and token in BaseTest.php to run all calls, but this will require some setup on the Google Developer Console.

    phpunit tests/

### Coding Style

To check for coding style violations, run

```
vendor/bin/phpcs src --standard=style/ruleset.xml -np
```

To automatically fix (fixable) coding style violations, run

```
vendor/bin/phpcbf src --standard=style/ruleset.xml
```
### Contributors ###
T. Chambers