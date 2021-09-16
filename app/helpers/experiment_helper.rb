module ExperimentHelper

    def recursive_display(tree)
        if tree.has_key? "tool"
            concat "<li>".html_safe
            concat render partial: 'tool/canvas_tool', locals: {tool: tree['tool']}
            concat "<ul>".html_safe
        end
        tree['children'].each do |node|
            recursive_display(node)
        end
        concat '<li><div class="tf-nc tool-slot dnd-zone"></div></li>'.html_safe
        concat "</ul>".html_safe
        concat "</li>".html_safe if tree.has_key? "tool"
    end

end