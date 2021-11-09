class User < ApplicationRecord
    # Include default devise modules. Others available are:
    # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
    devise :database_authenticatable, :registerable,
           :recoverable, :rememberable, :validatable

    has_many :experiments
    has_many :datasets

    def datasets_with_doc doc_id
        self.datasets.map do |dataset|
            [dataset.id, dataset.title] if dataset.contains doc_id.to_s
        end.delete_if(&:nil?)
    end

end
