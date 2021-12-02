Rails.application.config.session_store :active_record_store, :key => '_web_session'
# Run this regularly to clean up DB: 'rails db:sessions:trim'