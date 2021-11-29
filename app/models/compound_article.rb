class CompoundArticle < ActiveRecord::Base

    belongs_to :user, optional: false
    validates :title, length: { minimum: 1 }

end