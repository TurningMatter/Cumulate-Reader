function formatAsMarkdown(data) {
  let output = '';
  
  if (data.title) {
    output += `# ${data.title}\n\n`;
  }
  
  const meta = [];
  if (data.author) meta.push(`**Author:** ${data.author}`);
  if (data.publishedTime) meta.push(`**Published:** ${data.publishedTime}`);
  if (data.siteName) meta.push(`**Site:** ${data.siteName}`);
  meta.push(`**Source:** ${data.url}`);
  
  if (meta.length > 0) {
    output += meta.join(' | ') + '\n\n---\n\n';
  }
  
  if (data.excerpt && data.excerpt !== data.content.slice(0, data.excerpt.length)) {
    output += `> ${data.excerpt}\n\n`;
  }
  
  output += data.content;

  if (data.links && Object.keys(data.links).length > 0) {
    output += '\n\n---\n\n## Links\n\n';
    Object.entries(data.links).forEach(([text, href]) => {
      output += `- [${text}](${href})\n`;
    });
  }

  if (data.images && Object.keys(data.images).length > 0) {
    output += '\n\n---\n\n## Images\n\n';
    Object.entries(data.images).forEach(([alt, src]) => {
      output += `- ![${alt}](${src})\n`;
    });
  }
  
  return output;
}

module.exports = { formatAsMarkdown };
