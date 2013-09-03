# Rack configuration
# ==================
#
# Use this file to serve the app from a Rack-powered server such as Heroku.

use Rack::Static,
  :urls => %w(/stylesheets /javascripts /fonts),
  :root => File.dirname(__FILE__) + '/public'

run lambda { |env|
  [ 200, { 'Content-Type' => 'text/html' }, File.open('public/index.html') ]
}
