/\b(?<word>[a-z]+)\s+\k<word>\b/gi;
new RegExp('\\b(?<word>[a-z]+)\\s+\\k<word>\\b', 'gi');
new RegExp(`\b(?<word>[a-z]+)\s+\k<word>\b`, 'gi');
new RegExp(`\b([a-z]+)\s+\\1\b`, 'gi');

/\b(?<word>[a-z]+)\s+\k<word>\b/.source;
