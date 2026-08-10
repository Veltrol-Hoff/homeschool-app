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
                        let content = fs.readFileSync(file, 'utf8');
                        // Replace bg-white with bg-[#F7F3E7]
                        // or just bg-transparent
                        let safeContent = content.replace(/\bbg-white\b/g, 'bg-[#F7F3E7]');
                        
                        if (content !== safeContent) {
                            fs.writeFileSync(file, safeContent, 'utf8');
                            console.log('Updated ' + file);
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
    console.log('Done stripping bg-white!');
});
