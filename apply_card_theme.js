const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        var pending = list.length;
        if (!pending) return callback(null);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err) {
                        if (!--pending) callback(null);
                    });
                } else {
                    if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.css')) {
                        // Skip globals.css
                        if (file.endsWith('globals.css')) {
                            if (!--pending) callback(null);
                            return;
                        }
                        
                        let originalContent = fs.readFileSync(file, 'utf8');
                        let content = originalContent;

                        // Look for typical main card class combinations
                        // Example: bg-white  rounded-xl shadow-sm border border-stone-100
                        // Target: bg-[#F7F3E7] rounded-xl shadow-sm border-2 border-slate-700
                        
                        content = content.replace(/bg-white\s+(?:p-\d+\s+)?rounded-[a-z23]+\s+shadow-[a-z]+\s+border\s+border-(stone|slate)-\d{20,300}/g, function(match) {
                           // Try to make it more generic: just string replacements on specific patterns that define a "card"
                           return match; 
                        });

                        // Easier approach: replace combinations of classes anywhere inside className strings if they look like a primary card
                        // Let's just string replace standard fragments.
                        // Common fragments:
                        // "bg-white  rounded-xl shadow-sm border border-stone-100"
                        // "bg-white  rounded-2xl shadow-sm border border-stone-100"
                        // "bg-white p-6 rounded-xl shadow-sm border border-stone-100"
                        // We can just use a regex that matches `bg-white` and `border border-stone-` and `shadow`
                        
                        // We want to replace `bg-white` with `bg-[#F7F3E7]`
                        // And `border border-stone-100` (or 200/300) with `border-2 border-slate-700`
                        // Only for lines that contain `shadow-sm` or `shadow-md` and `rounded-`
                        
                        let lines = content.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            let line = lines[i];
                            if (line.includes('bg-white') && line.includes('rounded-') && (line.includes('border border-stone-100') || line.includes('border border-stone-200')) && line.includes('shadow-sm')) {
                                line = line.replace('bg-white', 'bg-[#F7F3E7]');
                                line = line.replace('border border-stone-100', 'border-2 border-slate-700');
                                line = line.replace('border border-stone-200', 'border-2 border-slate-700');
                                lines[i] = line;
                            }
                        }
                        
                        let newContent = lines.join('\n');
                        
                        if (originalContent !== newContent) {
                            fs.writeFileSync(file, newContent, 'utf8');
                            console.log('Updated cards in ' + file);
                        }
                    }
                    if (!--pending) callback(null);
                }
            });
        });
    });
}

walk('src', function(err) {
    if (err) throw err;
    console.log('Done applying card theme!');
});
