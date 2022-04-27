require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module NewspapersPlatform
    class Application < Rails::Application
        # Initialize configuration defaults for originally generated Rails version.
        config.load_defaults 6.1

        # Configuration for the application, engines, and railties goes here.
        #
        # These settings can be overridden in specific environments using the files
        # in config/environments, which are processed later.
        #
        # config.time_zone = "Central Time (US & Canada)"
        # config.eager_load_paths << Rails.root.join("extras")
        config.solr = config_for('solr')
        if File.exist? "#{Rails.root}/config/auths.yml"
            config.auths = config_for('auths')
        end
        config.active_job.queue_adapter = :sidekiq
        config.iiif_sources = config_for("iiif_sources")
    end
end
