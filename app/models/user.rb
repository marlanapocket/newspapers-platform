class User < ApplicationRecord
    # Include default devise modules. Others available are:
    # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
    devise :database_authenticatable, :registerable,
           :recoverable, :rememberable, :validatable

    has_many :experiments
    has_many :datasets
    has_many :notifications
    has_many :compound_articles

    def datasets_with_doc doc_id
        self.datasets.map do |dataset|
            [dataset.id, dataset.title] if dataset.contains doc_id.to_s
        end.delete_if(&:nil?)
    end

    def compounds_by_issue
        out = {}
        self.compound_articles.each do |compound_article|
            out[compound_article.issue_id] = [] unless out.has_key? compound_article.issue_id
            out[compound_article.issue_id] << compound_article
        end
        out
    end

    def researcher?
        Rails.configuration.auths['emails'].include? self.email
    end

end
