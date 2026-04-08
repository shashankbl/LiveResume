document.addEventListener('DOMContentLoaded', () => {
    const resumeContent = document.getElementById('resume-content');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    // Dynamically resolve the newest markdown file
    async function resolveLatestResumeFile() {
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        
        function getFileScore(filename) {
            // Support both _7th.April.2026.md and _Feb2026.md string styles
            const match1 = filename.match(/_([0-9a-zA-Z]+)\.([a-zA-Z]+)\.(\d{4})\.md$/i);
            const match2 = filename.match(/_([a-zA-Z]+)(\d{4})\.md$/i);
            
            let dateStr, monthStr, yearStr;
            if (match1) { dateStr = match1[1]; monthStr = match1[2]; yearStr = match1[3]; }
            else if (match2) { monthStr = match2[1]; yearStr = match2[2]; }
            else return 0;

            const monthIdx = months.findIndex(m => monthStr.toLowerCase().startsWith(m));
            const year = parseInt(yearStr);
            
            let day = 0;
            if (dateStr) {
                const dayMatch = dateStr.match(/(\d+)/);
                if (dayMatch) day = parseInt(dayMatch[1]);
            }

            // year * 10000 + month * 100 + day guarantees perfect hierarchical date ranking
            return year * 10000 + (monthIdx >= 0 ? monthIdx : 0) * 100 + day;
        }

        let fileCandidates = [];

        // 1. Try local server directory scrape explicitly looking inside resume_md/
        try {
            const localRes = await fetch('./resume_md/');
            const localHtml = await localRes.text();
            const matches = [...localHtml.matchAll(/href="(.*?\.md)"/gi)].map(m => `resume_md/${m[1]}`);
            fileCandidates.push(...matches);
        } catch (e) { }

        // Also check root as safe fallback
        try {
            const localResRoot = await fetch('./');
            const localHtmlRoot = await localResRoot.text();
            const matchesRoot = [...localHtmlRoot.matchAll(/href="(.*?\.md)"/gi)].map(m => m[1]);
            fileCandidates.push(...matchesRoot);
        } catch (e) { }

        // Extract valid resumes
        fileCandidates = fileCandidates.filter(f => f.toLowerCase().includes('resume') && f.endsWith('.md'));

        // 2. Absolute fallback (used on GitHub Pages where directory listing is unavailable)
        if (fileCandidates.length === 0) {
            return 'resume_md/YourName_Resume_7th.April.2026.md';
        }

        // Descending sort by chronological date using regex score extraction
        fileCandidates.sort((a, b) => getFileScore(b) - getFileScore(a)); 
        return fileCandidates[0];
    }

    // Resolve, extract UI info, and orchestrate rendering
    resolveLatestResumeFile().then(resumeFile => {
        // Extract timestamp from file name for display
        const match1 = resumeFile.match(/_([0-9a-zA-Z]+)\.([a-zA-Z]+)\.(\d{4})\.md$/i);
        const match2 = resumeFile.match(/_([a-zA-Z]+)(\d{4})\.md$/i);
        
        let dateStr, monthStr, yearStr;
        if (match1) { dateStr = match1[1]; monthStr = match1[2]; yearStr = match1[3]; }
        else if (match2) { monthStr = match2[1]; yearStr = match2[2]; }

        if (monthStr && yearStr) {
            const updatedLabel = document.getElementById('updated-label');
            if (updatedLabel) {
                const cleanMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase();
                if (dateStr) {
                    updatedLabel.textContent = `Updated: ${dateStr} ${cleanMonth} ${yearStr}`;
                } else {
                    updatedLabel.textContent = `Updated: ${cleanMonth} ${yearStr}`;
                }
            }
        }

        // Fetch and render the dynamically matched markdown
        fetch(resumeFile)
            .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${resumeFile} (Status: ${response.status})`);
            }
            return response.text();
        })
        .then(markdown => {
            // Preserve explicit empty newlines as visual space
            // In markdown \n\n is a standard block break. Any extra \n will become a <br>
            let processedMarkdown = markdown.replace(/\n\n\n+/g, match => {
                return '\n\n' + '<br>'.repeat(match.length - 2) + '\n\n';
            });

            // Handle custom $text$ syntax for 9pt font and 8 whitespace indent (2 tabs)
            processedMarkdown = processedMarkdown.replace(/\$([^$]+)\$/g, '<span class="small-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$1</span>');

            // Parse Markdown to HTML
            const html = marked.parse(processedMarkdown);
            
            // Create a temporary container to extract elements
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const elements = Array.from(tempDiv.children);

            // Robust grouping: gather all introductory paragraphs before the first heading into a dedicated header wrapper
            const headerWrapper = document.createElement('div');
            headerWrapper.className = 'resume-header';
            while(elements.length > 0 && !elements[0].tagName.match(/^H[1-6]$/i)) {
                headerWrapper.appendChild(elements.shift());
            }
            // Put the consolidated header back at the top of the processing queue
            if (headerWrapper.children.length > 0) {
                elements.unshift(headerWrapper);
            }

            // Setup wrapper for pages
            resumeContent.innerHTML = '';
            resumeContent.className = 'resume-wrapper';
            resumeContent.style.opacity = 0;

            const maxPageHeight = 979; // 11 inches (1056px) minus exactly 0.8 inches of total vertical padding (76.8px rounded mathematically)

            function createNewPage() {
                const page = document.createElement('div');
                page.className = 'page markdown-body';
                
                const inner = document.createElement('div');
                inner.className = 'page-inner';
                page.appendChild(inner);
                
                return { page, inner };
            }

            let current = createNewPage();
            resumeContent.appendChild(current.page);

            elements.forEach(el => {
                current.inner.appendChild(el);
                
                // Measure the unconstrained inner div height, not the fixed 11in parent
                if (current.inner.offsetHeight > maxPageHeight) {
                    // It overflowed, create a new page and move this element
                    current = createNewPage();
                    resumeContent.appendChild(current.page);
                    current.inner.appendChild(el);
                }
            });

            // Smoothly animate in
            let opacity = 0;
            const fadeIn = setInterval(() => {
                if (opacity >= 1) clearInterval(fadeIn);
                resumeContent.style.opacity = opacity;
                opacity += 0.05;
            }, 10);
            
            // Post-process HTML links
            processLinks();
        })
        .catch(error => {
            resumeContent.innerHTML = `
                <div style="color: #e11d48; padding: 20px; background: #ffe4e6; border-radius: 8px; font-weight: 500;">
                    Error loading resume markdown: ${error.message}<br><br>
                    Make sure you're running this via a web server (e.g., using GitHub Pages or a local server) and not double-clicking the file directly.
                </div>`;
            console.error('Error fetching resume:', error);
        });
    });

    function processLinks() {
        const links = resumeContent.querySelectorAll('a');
        links.forEach(link => {
            if (link.textContent.includes('@') && !link.href) {
                link.href = `mailto:${link.textContent}`;
            }
            
            // Force link to open in new tab securely
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }

    // Handle print/download PDF
    downloadPdfBtn.addEventListener('click', () => {
        window.print();
    });

    // Handle font toggle group
    document.querySelectorAll('.font-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.font-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.body.classList.toggle('sans-serif-font', btn.dataset.font === 'sans');
        });
    });
});
