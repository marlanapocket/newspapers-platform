class Tool < ActiveRecord::Base

    belongs_to :experiment, optional: false

    def to_h
        {
          "tool": {
            "id": self.id
          },
          "children": []
        }
    end

    def run
        "#{self.tool_type}_worker".camelize.constantize.perform_async(self.id, self.experiment.user.id, self.experiment.id, self.tool_type, self.parameters)
    end

end
