class Experiment < ActiveRecord::Base

    belongs_to :user, optional: false
    validates :title, length: { minimum: 1 }

    def add_tool(parent_id, tool)
        if parent_id != 0
            self.locate_tool(self.description, parent_id) do |t|
                t['children'] << tool.to_h
            end
        else
            self.description['children'] << tool.to_h
        end
    end

    def delete_tool(tool_id)
        ids = detach_tool(self.description, nil, tool_id)
    end

    def load_tools
        ids = gather_ids self.description
        Tool.where(id: ids).pluck(:id, :status, :tool_type, :input_type, :output_type, :parent_id).map do |t|
            [t[0], {id: t[0], status: t[1], type: t[2], input_type: t[3], output_type: t[4], parent_id: t[5]}]
        end.to_h
    end

    def finished?
        tools = self.load_tools
        tools.values.all? { |t| t[:status] == "finished" }
    end

    def running?
        tools = self.load_tools
        tools.values.any? { |t| t[:status] == "running" }
    end

    def get_tool_ids
        gather_ids self.description
    end

    def continue_from(tool_id)
        locate_tool(self.description, tool_id) do |t|
            tools_to_start = t['children'].map { |c| c['tool']['id'] }
            tools_to_start.each do |tool_id|
                tool = Tool.find(tool_id)
                tool.run(true) if tool.runnable?
            end
        end
    end

    private

    def locate_tool(tree_part, tool_id, &block)
        if tree_part.has_key?('tool')
            if tree_part['tool']['id'] == tool_id
                yield tree_part
                return true
            else
                tree_part['children'].each do |subtree|
                    return true if locate_tool(subtree, tool_id, &block)
                end
            end
        else
            if tree_part['children'].empty?
                yield tree_part
            end
            tree_part['children'].each do |subtree|
                return true if locate_tool(subtree, tool_id, &block)
            end
        end
        false
    end

    def detach_tool(tree, parent_array, tool_id, &block)
        if tree.has_key?('tool')
            if tree['tool']['id'] == tool_id
                ids = gather_ids(tree)
                parent_array.delete(tree) unless parent_array.nil?
                return ids
            else
                tree['children'].each do |subtree|
                    res = detach_tool(subtree, tree['children'], tool_id, &block)
                    return res unless res.nil?
                end
            end
        else
            tree['children'].each do |subtree|
                res = detach_tool(subtree, tree['children'], tool_id, &block)
                return res unless res.nil?
            end
        end
        nil
    end

    def gather_ids(tree, ids=[])
        tree['children'].each do |subtree|
            ids.concat(gather_ids(subtree))
        end
        if tree.has_key?('tool')
            ids << tree['tool']['id']
        end
        return ids
    end

end
