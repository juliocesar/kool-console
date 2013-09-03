# encoding: UTF-8

# ὅπλα / Hopla - My weapons of choice
# ===================================
#
# A dev suite that lets you use templates (for gems you have installed)
# along with SASS/compass and CoffeeScript.
#
# Just install the gems listed in `rake hopla:gems`, then run
#
# $ rake hopla
#
# And you're all set! Make sure you're running ruby 1.9.

# Dependencies.
gems         = %w(rack colorize compass sprockets nokogiri)
extras       = %w(sprockets-helpers haml_coffee_assets)
dependencies = gems + extras + %w(pathname logger fileutils ostruct tmpdir)
begin
  dependencies.map { |lib| require lib }
rescue LoadError
  STDERR.puts %Q(

    Error loading one or more required gems. Ensure you have the required
    gems by running.

    $ gem install #{gems.join ' '}

    Or add them to your Gemfile and run `bundle install`. Additionally, you
    may want to run:

    $ gem install haml coffee-script

  )
  exit 1
end

# String / File.join hack to cut some characters.
class String
  def /(to) File.join(self, to); end
end

# Helpers.
def packaged?
  File.exists? Dir.pwd + '/public/index.html' and
    File.exists? Dir.pwd + '/public/stylesheets/manifest.css' and
    File.exists? Dir.pwd + '/public/javascripts/manifest.js'
end

# Compresses a script file.
def compress_js filename
  path = Dir.pwd + "/public/javascripts/#{filename}"
  if not File.exists? path
    STDERR.puts "File not found: #{path}"
    return false
  end
  Hopla.logger.info "Compressing #{path}..."
  contents = File.read path
  File.open(path, 'w') do |file|
    file << Uglifier.compile(contents)
  end
  Hopla.logger.info "Done!"
end


# The main module containing our code and instances.
Hopla = OpenStruct.new

# A few paths we'll be referring to throughout the app.
Hopla.Root      = File.dirname __FILE__
Hopla.Public    = 'public'
Hopla.Assets    = 'assets'
Hopla.Scripts   = Hopla.Assets/'javascripts'
Hopla.Styles    = Hopla.Assets/'stylesheets'
Hopla.Templates = Hopla.Assets/'templates'
Hopla.Extras    = Hopla.Root/'extras'

# Our pretty logger. A.K.A. the definition of going the extra mile.
class HoplaLogger < ::Logger
  def format_message severity, timestamp, program, message
    "  #{"————⥲".yellow}  %s" % message + "\n"
  end
end
Hopla.logger = HoplaLogger.new STDOUT
Hopla.logger.level = ::Logger::INFO

# So templates don't end up in window.JST['javascript/templates'].
HamlCoffeeAssets.config.name_filter = lambda do |name|
  parts = name.sub(/^javascripts\/templates\//, '').split('/')
  parts.last.sub!(/^_/, '')
  parts.join('/')
end

# The styles and scripts compiler, which is just an instance of
# Sprockets::Environment.
Hopla.compiler = Sprockets::Environment.new Pathname(Hopla.Root) do |env|
  # Cache.
  env.cache = Sprockets::Cache::FileStore.new(Dir.tmpdir)

  # Log to the standard output.
  env.logger = Hopla.logger

  # Required for haml_coffee_assets.
  env.prepend_path File.dirname(HamlCoffeeAssets.helpers_path)

  # Add all compass paths to it.
  Compass.sass_engine_options[:load_paths].each do |path|
    env.prepend_path path.to_s
  end

  # Append the root path, so refs like javascripts/xyz will also work.
  env.prepend_path Hopla.Scripts
  env.prepend_path Hopla.Styles
  env.prepend_path Hopla.Assets

  # Needed since Sprockets 2.5.
  env.context_class.class_eval do
    def asset_path path, options = {}; path end
  end
end
# ---

# The preview server. Any middlewares that it needs to use should be
# pushed into Hopla.middlewares.
Hopla.middlewares = []

def Hopla.make_preview_server
  Rack::Builder.app do
    static_server = Rack::File.new Hopla.Public

    # Load all middlewares required by extras.
    Hopla.middlewares.each { |middleware, *options| use middleware, *options }

    # Tiny middleware for serving an index.html file for "directory"
    # paths. E.g.: serves '/coco/index.html' if you request '/coco/'.
    # It'll serve a compiled template for a request path should a static
    # HTML file not exist.
    template_server = lambda { |env|
      env['PATH_INFO'] = '/' if ENV['FORCE_INDEX']
      noext    = env['PATH_INFO'].sub /\.\w+$/, ''
      path     = noext[-1] == "/" ? noext/'index' : noext
      static   = Dir["#{Hopla.Public/path}.html"][0]
      template = Dir["#{Hopla.Templates/path}.*"][0]
      if static
        [200, {'Content-Type' => 'text/html'}, File.open(static)]
      elsif template
        [200, {'Content-Type' => 'text/html'}, [Tilt.new(template).render]]
      else
        [404, {'Content-Type' => 'text/plain'}, ["Template not found: #{path}"]]
      end
    }

    # Serve, by priority:
    #   1 - any static files that exist in the public dir.
    #   2 - scripts and stylesheets, compiling them before serving.
    #   3 - index.html or compiled templates matching the path requested.
    run lambda { |env|
      response = static_server.call env
      response = Hopla.compiler.call env if response[0] == 404
      response = template_server.call env if response[0] == 404
      response
    }
  end
end
# ---

# Steal everything going to stdout and ensure it conforms with
# our aesthetic standards.
def $stdout.puts *args
  Hopla.logger.info *args
end

# These rake tasks are part of Hopla core. Of "non-private" nature are
# the preview server and compile tasks.
namespace :hopla do

  # Load all extra tasks it finds in extras/.
  Dir["#{Hopla.Extras}/*.rb"].each do |extra|
    require extra
  end

  desc "Runs Hopla"
  task :run => [:check] do
    Hopla.logger.info "ὅπλα / Hopla starting. Listening on port 4567".red
    Rack::Server.start :app => Hopla.make_preview_server, :Port => 4567
  end

  desc "Compiles all templates, and assets referred to in said templates"
  task :compile do
    Dir["#{Hopla.Templates}/**/*"].each do |template|
      target = Hopla.Public/template.sub(Hopla.Templates, '').sub(/.\w+$/, '.html')
      File.open(target, 'w') do |file| file << Tilt.new(template).render; end
      Hopla.logger.info "Compiled #{template.red}"
    end

    # For each HTML file in the public directory...
    Dir["#{Hopla.Public}/**/*.html"].each do |html|

      # .. open it with Nokogiri
      document = Nokogiri::HTML File.read(html)

      # ... get each script with a "src" attribute
      document.css('script[src]').each do |script|
        # ... if asset found in sprockets, compile/write it to public/
        relative_asset_path = script['src'].sub(/^\//, '')
        if asset = Hopla.compiler[relative_asset_path]
          asset.write_to Hopla.Public/script['src']
          Hopla.logger.info "Compiled #{relative_asset_path.red}"
        end
      end

      # ... get each stylesheet
      document.css('link[rel="stylesheet"][href]').each do |css|
        # ... if asset found in sprockets, compile/write it to public/
        relative_asset_path = css['href'].sub(/^\//, '')
        if asset = Hopla.compiler[relative_asset_path]
          asset.write_to Hopla.Public/css['href']
          Hopla.logger.info "Compiled #{relative_asset_path.red}"
        end
      end
    end
  end

  desc "Creates all the directories needed for Hopla"
  task :setup do
    Hopla.logger.info "Creating necessary directories..."
    FileUtils.mkdir_p Hopla.Scripts
    FileUtils.mkdir_p Hopla.Styles
    FileUtils.mkdir_p Hopla.Public
    FileUtils.mkdir_p Hopla.Templates
  end

  desc "Checks whether the necessary directories exist"
  task :check do
    needs_setup = [Hopla.Scripts, Hopla.Styles, Hopla.Public, Hopla.Templates].any? do |dir|
      not File.directory? dir
    end
    Rake::Task['hopla:setup'].invoke if needs_setup
  end

  desc "Compresses packaged JavaScripts using UglifyJS2"
  task :compress_javascripts => [:compile] do
    begin
      require 'uglifier'
    rescue LoadError
      STDERR.puts %Q(
        Compression requires the "uglifier" gem. Make sure you run:

        $ gem install uglifier

      )
      exit 1
    end
    compress_js "manifest.js"
  end

  desc "Deletes all compiled assets and templates"
  task :cleanup do
    Hopla.logger.info "Cleaning up..."
    File.delete Dir.pwd + '/public/index.html' rescue nil
    File.delete Dir.pwd + '/public/javascripts/manifest.js' rescue nil
    File.delete Dir.pwd + '/public/stylesheets/manifest.css' rescue nil
  end

  desc "Creates a temporary commit with the static assets included"
  task :commit => [:compress_javascripts] do
    Hopla.logger.info "Committing assets to the local repo for deployment..."
    `git add public/index.html`
    `git add public/javascripts/manifest.js`
    `git add public/stylesheets/manifest.css`
    `git commit -m "DEPLOYMENT - DELETE ME"`
  end

  desc "Reverts the static assets commit"
  task :delete_commit do
    if `git log -1` =~ /DEPLOYMENT - DELETE ME/
      `git reset --hard HEAD^1`
      Hopla.logger.info "Reverted exist static assets commit"
    end
  end
end
# ---

# Default rake task for when ran as `rake hopla`.
task :hopla => ['hopla:run']
