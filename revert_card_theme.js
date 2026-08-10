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
                        let lines = originalContent.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            let line = lines[i];
                            if (line.includes('bg-[#F7F3E7]') && line.includes('border-2 border-slate-700')) {
                                line = line.replace('bg-[#F7F3E7]', 'bg-white');
                                line = line.replace('border-2 border-slate-700', 'border border-stone-100');
                                lines[i] = line;
                            }
                        }
                        
                        let newContent = lines.join('\n');
                        
                        if (originalContent !== newContent) {
                            fs.writeFileSync(file, newContent, 'utf8');
                            console.log('Reverted cards in ' + file);
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
    console.log('Done reverting card theme!');
});
