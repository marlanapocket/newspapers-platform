class Notification < ActiveRecord::Base

    belongs_to :user, optional: false

    
end