var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hideNavForHandbook = exports.showNavForHandbook = exports.gistPoweredNavBar = void 0;
    /**
     * Uses the Playground gist proxy to generate a set of stories ^ which
     * correspond to files in the
     */
    const gistPoweredNavBar = (sandbox, ui, showNav) => {
        const gistHash = location.hash.split("#gist/")[1];
        const [gistID] = gistHash.split("-");
        // @ts-ignore
        window.appInsights && window.appInsights.trackEvent({ name: "Loaded Gist Playground", properties: { id: gistID } });
        sandbox.editor.updateOptions({ readOnly: true });
        ui.flashInfo(`Opening Gist ${gistID} as a Docset`, 2000);
        // Disable the handbook button because we can't have two sidenavs
        const handbookButton = document.getElementById("handbook-button");
        if (handbookButton) {
            handbookButton.parentElement.classList.add("disabled");
        }
        const playground = document.getElementById("playground-container");
        playground.style.opacity = "0.5";
        // const relay = "http://localhost:7071/api/API"
        const relay = "https://typescriptplaygroundgistproxyapi.azurewebsites.net/api/API";
        fetch(`${relay}?gistID=${gistID}`)
            .then((res) => __awaiter(void 0, void 0, void 0, function* () {
            // Make editor work again
            playground.style.opacity = "1";
            sandbox.editor.updateOptions({ readOnly: false });
            const response = yield res.json();
            if ("error" in response) {
                return ui.flashInfo(`Error with getting your gist: ${response.display}.`, 3000);
            }
            // If the API response is a single code file, just throw that in
            if (response.type === "code") {
                sandbox.setText(response.code);
                sandbox.setCompilerSettings(response.params);
                // If it's multi-file, then there's work to do
            }
            else if (response.type === "story") {
                showNav();
                const prefix = `#gist/${gistID}`;
                updateNavWithStoryContent(response.title, response.files, prefix, sandbox);
            }
        }))
            .catch(() => {
            ui.flashInfo("Could not reach the gist to playground API, are you (or it) offline?");
            playground.style.opacity = "1";
            sandbox.editor.updateOptions({ readOnly: false });
        });
    };
    exports.gistPoweredNavBar = gistPoweredNavBar;
    /** Use the handbook TOC which is injected into the globals to create a sidebar  */
    const showNavForHandbook = (sandbox, escapeFunction) => {
        // @ts-ignore
        const content = window.playgroundHandbookTOC.docs;
        const button = document.createElement("button");
        button.ariaLabel = "Close handbook";
        button.className = "examples-close";
        button.innerText = "Close";
        button.onclick = escapeFunction;
        const story = document.getElementById("editor-container");
        story === null || story === void 0 ? void 0 : story.appendChild(button);
        updateNavWithStoryContent("Handbook", content, "#handbook", sandbox);
        const nav = document.getElementById("navigation-container");
        if (nav)
            nav.classList.add("handbook");
    };
    exports.showNavForHandbook = showNavForHandbook;
    /**
     * Hides the nav and the close button, specifically only when we have
     * the handbook open and not when a gist is open
     */
    const hideNavForHandbook = (sandbox) => {
        const nav = document.getElementById("navigation-container");
        if (!nav)
            return;
        if (!nav.classList.contains("handbook"))
            return;
        showCode(sandbox);
        nav.style.display = "none";
        const leftDrag = document.querySelector(".playground-dragbar.left");
        if (leftDrag)
            leftDrag.style.display = "none";
        const story = document.getElementById("editor-container");
        const possibleButtonToRemove = story === null || story === void 0 ? void 0 : story.querySelector("button");
        if (story && possibleButtonToRemove)
            story.removeChild(possibleButtonToRemove);
    };
    exports.hideNavForHandbook = hideNavForHandbook;
    /**
     * Assumes a nav has been set up already, and then fills out the content of the nav bar
     * with clickable links for each potential story.
     */
    const updateNavWithStoryContent = (title, storyContent, prefix, sandbox) => {
        const nav = document.getElementById("navigation-container");
        if (!nav)
            return;
        while (nav.firstChild) {
            nav.removeChild(nav.firstChild);
        }
        const titleh4 = document.createElement("h4");
        titleh4.textContent = title;
        nav.appendChild(titleh4);
        // Make all the sidebar elements
        const ul = document.createElement("ul");
        storyContent.forEach((element, i) => {
            const li = document.createElement("li");
            switch (element.type) {
                case "html":
                case "href":
                case "code": {
                    li.classList.add("selectable");
                    const a = document.createElement("a");
                    let logo;
                    if (element.type === "code") {
                        logo = `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="7" height="7" fill="#187ABF"/></svg>`;
                    }
                    else if (element.type === "html") {
                        logo = `<svg width="9" height="11" viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.5V3.25L6 1H4M8 5.5V10H1V1H4M8 5.5H4V1" stroke="#C4C4C4"/></svg>`;
                    }
                    else {
                        logo = "";
                    }
                    a.innerHTML = `${logo}${element.title}`;
                    a.href = `/play#${prefix}-${i}`;
                    a.onclick = e => {
                        e.preventDefault();
                        // Note: I'm not sure why this is needed?
                        const ed = sandbox.editor.getDomNode();
                        if (!ed)
                            return;
                        sandbox.editor.updateOptions({ readOnly: false });
                        const alreadySelected = ul.querySelector(".selected");
                        if (alreadySelected)
                            alreadySelected.classList.remove("selected");
                        li.classList.add("selected");
                        switch (element.type) {
                            case "code":
                                setCode(element.code, sandbox);
                                break;
                            case "html":
                                setStory(element.html, sandbox);
                                break;
                            case "href":
                                setStoryViaHref(element.href, sandbox);
                                break;
                        }
                        // Set the URL after selecting
                        const alwaysUpdateURL = !localStorage.getItem("disable-save-on-type");
                        if (alwaysUpdateURL) {
                            location.hash = `${prefix}-${i}`;
                        }
                        return false;
                    };
                    li.appendChild(a);
                    break;
                }
                case "hr": {
                    const hr = document.createElement("hr");
                    li.appendChild(hr);
                }
            }
            ul.appendChild(li);
        });
        nav.appendChild(ul);
        const pageID = location.hash.split("-")[1] || "";
        const index = Number(pageID) || 0;
        const targetedLi = ul.children.item(index) || ul.children.item(0);
        if (targetedLi) {
            const a = targetedLi.getElementsByTagName("a").item(0);
            // @ts-ignore
            if (a)
                a.click();
        }
    };
    // Use fetch to grab the HTML from a URL, with a special case 
    // when that is a gatsby URL where we pull out the important
    // HTML from inside the __gatsby id.
    const setStoryViaHref = (href, sandbox) => {
        fetch(href).then((req) => __awaiter(void 0, void 0, void 0, function* () {
            if (req.ok) {
                const text = yield req.text();
                if (text.includes("___gatsby")) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, "text/html");
                    const gatsby = doc.getElementById('___gatsby');
                    if (gatsby) {
                        gatsby.id = "___inner_g";
                        setStory(gatsby, sandbox);
                    }
                    return;
                }
                if (document.location.host === "localhost:8000") {
                    setStory("<p>Because the gatsby dev server uses JS to build your pages, and not statically, the page will not load during dev. It does work in prod though - use <code>yarn build-site</code> to test locally with a static build.</p>", sandbox);
                }
                else {
                    setStory(text, sandbox);
                }
            }
            else {
                setStory(`<p>Failed to load the content at ${href}. Reason: ${req.status} ${req.statusText}</p>`, sandbox);
            }
        }));
    };
    /**
     * Passing in either a root HTML element or the HTML for the story, present a
     * markdown doc as a 'story' inside the playground.
     */
    const setStory = (html, sandbox) => {
        const toolbar = document.getElementById("editor-toolbar");
        if (toolbar)
            toolbar.style.display = "none";
        const monaco = document.getElementById("monaco-editor-embed");
        if (monaco)
            monaco.style.display = "none";
        const story = document.getElementById("story-container");
        if (!story)
            return;
        story.style.display = "block";
        if (typeof html === "string") {
            story.innerHTML = html;
        }
        else {
            while (story.firstChild) {
                story.removeChild(story.firstChild);
            }
            story.appendChild(html);
        }
        // We need to hijack internal links
        for (const a of Array.from(story.getElementsByTagName("a"))) {
            if (!a.pathname.startsWith("/play"))
                continue;
            // Note the the header generated links also count in here
            // overwrite playground links
            if (a.hash.includes("#code/")) {
                a.onclick = e => {
                    const code = a.hash.replace("#code/", "").trim();
                    let userCode = sandbox.lzstring.decompressFromEncodedURIComponent(code);
                    // Fallback incase there is an extra level of decoding:
                    // https://gitter.im/Microsoft/TypeScript?at=5dc478ab9c39821509ff189a
                    if (!userCode)
                        userCode = sandbox.lzstring.decompressFromEncodedURIComponent(decodeURIComponent(code));
                    if (userCode)
                        setCode(userCode, sandbox);
                    e.preventDefault();
                    const alreadySelected = document.getElementById("navigation-container").querySelector("li.selected");
                    if (alreadySelected)
                        alreadySelected.classList.remove("selected");
                    return false;
                };
            }
            // overwrite gist/handbook links
            else if (a.hash.includes("#gist/") || a.hash.includes("#handbook")) {
                a.onclick = e => {
                    const index = Number(a.hash.split("-")[1]);
                    const nav = document.getElementById("navigation-container");
                    if (!nav)
                        return;
                    const ul = nav.getElementsByTagName("ul").item(0);
                    const targetedLi = ul.children.item(Number(index) || 0) || ul.children.item(0);
                    if (targetedLi) {
                        const a = targetedLi.getElementsByTagName("a").item(0);
                        // @ts-ignore
                        if (a)
                            a.click();
                    }
                    e.preventDefault();
                    return false;
                };
            }
            else {
                a.setAttribute("target", "_blank");
            }
        }
    };
    const showCode = (sandbox) => {
        const story = document.getElementById("story-container");
        if (story)
            story.style.display = "none";
        const toolbar = document.getElementById("editor-toolbar");
        if (toolbar)
            toolbar.style.display = "block";
        const monaco = document.getElementById("monaco-editor-embed");
        if (monaco)
            monaco.style.display = "block";
        sandbox.editor.layout();
    };
    const setCode = (code, sandbox) => {
        sandbox.setText(code);
        showCode(sandbox);
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL25hdmlnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQVNBOzs7T0FHRztJQUNJLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxPQUFnQixFQUFFLEVBQU0sRUFBRSxPQUFtQixFQUFFLEVBQUU7UUFDakYsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDakQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFFcEMsYUFBYTtRQUNiLE1BQU0sQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsd0JBQXdCLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUVuSCxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQ2hELEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLE1BQU0sY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRXhELGlFQUFpRTtRQUNqRSxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUE7UUFDakUsSUFBSSxjQUFjLEVBQUU7WUFDbEIsY0FBYyxDQUFDLGFBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1NBQ3hEO1FBRUQsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBRSxDQUFBO1FBQ25FLFVBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUss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Q0FBQTtRQUNyQixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDbkIsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsidHlwZSBTdG9yeUNvbnRlbnQgPVxuICB8IHsgdHlwZTogXCJodG1sXCI7IGh0bWw6IHN0cmluZzsgdGl0bGU6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcImhyZWZcIjsgaHJlZjogc3RyaW5nOyB0aXRsZTogc3RyaW5nIH1cbiAgfCB7IHR5cGU6IFwiY29kZVwiOyBjb2RlOiBzdHJpbmc7IHBhcmFtczogc3RyaW5nOyB0aXRsZTogc3RyaW5nIH1cbiAgfCB7IHR5cGU6IFwiaHJcIiB9XG5cbmltcG9ydCB0eXBlIHsgU2FuZGJveCB9IGZyb20gXCJAdHlwZXNjcmlwdC9zYW5kYm94XCJcbmltcG9ydCB0eXBlIHsgVUkgfSBmcm9tIFwiLi9jcmVhdGVVSVwiXG5cbi8qKlxuICogVXNlcyB0aGUgUGxheWdyb3VuZCBnaXN0IHByb3h5IHRvIGdlbmVyYXRlIGEgc2V0IG9mIHN0b3JpZXMgXiB3aGljaCBcbiAqIGNvcnJlc3BvbmQgdG8gZmlsZXMgaW4gdGhlIFxuICovXG5leHBvcnQgY29uc3QgZ2lzdFBvd2VyZWROYXZCYXIgPSAoc2FuZGJveDogU2FuZGJveCwgdWk6IFVJLCBzaG93TmF2OiAoKSA9PiB2b2lkKSA9PiB7XG4gIGNvbnN0IGdpc3RIYXNoID0gbG9jYXRpb24uaGFzaC5zcGxpdChcIiNnaXN0L1wiKVsxXVxuICBjb25zdCBbZ2lzdElEXSA9IGdpc3RIYXNoLnNwbGl0KFwiLVwiKVxuXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LmFwcEluc2lnaHRzICYmIHdpbmRvdy5hcHBJbnNpZ2h0cy50cmFja0V2ZW50KHsgbmFtZTogXCJMb2FkZWQgR2lzdCBQbGF5Z3JvdW5kXCIsIHByb3BlcnRpZXM6IHsgaWQ6IGdpc3RJRCB9IH0pXG5cbiAgc2FuZGJveC5lZGl0b3IudXBkYXRlT3B0aW9ucyh7IHJlYWRPbmx5OiB0cnVlIH0pXG4gIHVpLmZsYXNoSW5mbyhgT3BlbmluZyBHaXN0ICR7Z2lzdElEfSBhcyBhIERvY3NldGAsIDIwMDApXG5cbiAgLy8gRGlzYWJsZSB0aGUgaGFuZGJvb2sgYnV0dG9uIGJlY2F1c2Ugd2UgY2FuJ3QgaGF2ZSB0d28gc2lkZW5hdnNcbiAgY29uc3QgaGFuZGJvb2tCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhhbmRib29rLWJ1dHRvblwiKVxuICBpZiAoaGFuZGJvb2tCdXR0b24pIHtcbiAgICBoYW5kYm9va0J1dHRvbi5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIilcbiAgfVxuXG4gIGNvbnN0IHBsYXlncm91bmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXlncm91bmQtY29udGFpbmVyXCIpIVxuICBwbGF5Z3JvdW5kLnN0eWxlLm9wYWNpdHkgPSBcIjAuNVwiXG5cbiAgLy8gY29uc3QgcmVsYXkgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6NzA3MS9hcGkvQVBJXCJcbiAgY29uc3QgcmVsYXkgPSBcImh0dHBzOi8vdHlwZXNjcmlwdHBsYXlncm91bmRnaXN0cHJveHlhcGkuYXp1cmV3ZWJzaXRlcy5uZXQvYXBpL0FQSVwiXG4gIGZldGNoKGAke3JlbGF5fT9naXN0SUQ9JHtnaXN0SUR9YClcbiAgICAudGhlbihhc3luYyByZXMgPT4ge1xuICAgICAgLy8gTWFrZSBlZGl0b3Igd29yayBhZ2FpblxuICAgICAgcGxheWdyb3VuZC5zdHlsZS5vcGFjaXR5ID0gXCIxXCJcbiAgICAgIHNhbmRib3guZWRpdG9yLnVwZGF0ZU9wdGlvbnMoeyByZWFkT25seTogZmFsc2UgfSlcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXMuanNvbigpXG4gICAgICBpZiAoXCJlcnJvclwiIGluIHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiB1aS5mbGFzaEluZm8oYEVycm9yIHdpdGggZ2V0dGluZyB5b3VyIGdpc3Q6ICR7cmVzcG9uc2UuZGlzcGxheX0uYCwgMzAwMClcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIEFQSSByZXNwb25zZSBpcyBhIHNpbmdsZSBjb2RlIGZpbGUsIGp1c3QgdGhyb3cgdGhhdCBpblxuICAgICAgaWYgKHJlc3BvbnNlLnR5cGUgPT09IFwiY29kZVwiKSB7XG4gICAgICAgIHNhbmRib3guc2V0VGV4dChyZXNwb25zZS5jb2RlKVxuICAgICAgICBzYW5kYm94LnNldENvbXBpbGVyU2V0dGluZ3MocmVzcG9uc2UucGFyYW1zKVxuXG4gICAgICAgIC8vIElmIGl0J3MgbXVsdGktZmlsZSwgdGhlbiB0aGVyZSdzIHdvcmsgdG8gZG9cbiAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UudHlwZSA9PT0gXCJzdG9yeVwiKSB7XG4gICAgICAgIHNob3dOYXYoKVxuICAgICAgICBjb25zdCBwcmVmaXggPSBgI2dpc3QvJHtnaXN0SUR9YFxuICAgICAgICB1cGRhdGVOYXZXaXRoU3RvcnlDb250ZW50KHJlc3BvbnNlLnRpdGxlLCByZXNwb25zZS5maWxlcywgcHJlZml4LCBzYW5kYm94KVxuICAgICAgfVxuICAgIH0pXG4gICAgLmNhdGNoKCgpID0+IHtcbiAgICAgIHVpLmZsYXNoSW5mbyhcIkNvdWxkIG5vdCByZWFjaCB0aGUgZ2lzdCB0byBwbGF5Z3JvdW5kIEFQSSwgYXJlIHlvdSAob3IgaXQpIG9mZmxpbmU/XCIpXG4gICAgICBwbGF5Z3JvdW5kLnN0eWxlLm9wYWNpdHkgPSBcIjFcIlxuICAgICAgc2FuZGJveC5lZGl0b3IudXBkYXRlT3B0aW9ucyh7IHJlYWRPbmx5OiBmYWxzZSB9KVxuICAgIH0pXG59XG5cbi8qKiBVc2UgdGhlIGhhbmRib29rIFRPQyB3aGljaCBpcyBpbmplY3RlZCBpbnRvIHRoZSBnbG9iYWxzIHRvIGNyZWF0ZSBhIHNpZGViYXIgICovXG5leHBvcnQgY29uc3Qgc2hvd05hdkZvckhhbmRib29rID0gKHNhbmRib3g6IFNhbmRib3gsIGVzY2FwZUZ1bmN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gIC8vIEB0cy1pZ25vcmVcbiAgY29uc3QgY29udGVudCA9IHdpbmRvdy5wbGF5Z3JvdW5kSGFuZGJvb2tUT0MuZG9jc1xuXG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIilcbiAgYnV0dG9uLmFyaWFMYWJlbCA9IFwiQ2xvc2UgaGFuZGJvb2tcIlxuICBidXR0b24uY2xhc3NOYW1lID0gXCJleGFtcGxlcy1jbG9zZVwiXG4gIGJ1dHRvbi5pbm5lclRleHQgPSBcIkNsb3NlXCJcbiAgYnV0dG9uLm9uY2xpY2sgPSBlc2NhcGVGdW5jdGlvblxuXG4gIGNvbnN0IHN0b3J5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0b3ItY29udGFpbmVyXCIpXG4gIHN0b3J5Py5hcHBlbmRDaGlsZChidXR0b24pXG4gIHVwZGF0ZU5hdldpdGhTdG9yeUNvbnRlbnQoXCJIYW5kYm9va1wiLCBjb250ZW50LCBcIiNoYW5kYm9va1wiLCBzYW5kYm94KVxuXG4gIGNvbnN0IG5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2aWdhdGlvbi1jb250YWluZXJcIilcbiAgaWYgKG5hdikgbmF2LmNsYXNzTGlzdC5hZGQoXCJoYW5kYm9va1wiKVxufVxuXG4vKiogXG4gKiBIaWRlcyB0aGUgbmF2IGFuZCB0aGUgY2xvc2UgYnV0dG9uLCBzcGVjaWZpY2FsbHkgb25seSB3aGVuIHdlIGhhdmVcbiAqIHRoZSBoYW5kYm9vayBvcGVuIGFuZCBub3Qgd2hlbiBhIGdpc3QgaXMgb3BlblxuICovXG5leHBvcnQgY29uc3QgaGlkZU5hdkZvckhhbmRib29rID0gKHNhbmRib3g6IFNhbmRib3gpID0+IHtcbiAgY29uc3QgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZpZ2F0aW9uLWNvbnRhaW5lclwiKVxuICBpZiAoIW5hdikgcmV0dXJuXG4gIGlmICghbmF2LmNsYXNzTGlzdC5jb250YWlucyhcImhhbmRib29rXCIpKSByZXR1cm5cblxuICBzaG93Q29kZShzYW5kYm94KVxuICBuYXYuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG5cbiAgY29uc3QgbGVmdERyYWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtZHJhZ2Jhci5sZWZ0XCIpIGFzIEhUTUxFbGVtZW50XG4gIGlmIChsZWZ0RHJhZykgbGVmdERyYWcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG5cbiAgY29uc3Qgc3RvcnkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRvci1jb250YWluZXJcIilcbiAgY29uc3QgcG9zc2libGVCdXR0b25Ub1JlbW92ZSA9IHN0b3J5Py5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uXCIpXG4gIGlmIChzdG9yeSAmJiBwb3NzaWJsZUJ1dHRvblRvUmVtb3ZlKSBzdG9yeS5yZW1vdmVDaGlsZChwb3NzaWJsZUJ1dHRvblRvUmVtb3ZlKVxufVxuXG4vKiogXG4gKiBBc3N1bWVzIGEgbmF2IGhhcyBiZWVuIHNldCB1cCBhbHJlYWR5LCBhbmQgdGhlbiBmaWxscyBvdXQgdGhlIGNvbnRlbnQgb2YgdGhlIG5hdiBiYXJcbiAqIHdpdGggY2xpY2thYmxlIGxpbmtzIGZvciBlYWNoIHBvdGVudGlhbCBzdG9yeS5cbiAqL1xuY29uc3QgdXBkYXRlTmF2V2l0aFN0b3J5Q29udGVudCA9ICh0aXRsZTogc3RyaW5nLCBzdG9yeUNvbnRlbnQ6IFN0b3J5Q29udGVudFtdLCBwcmVmaXg6IHN0cmluZywgc2FuZGJveDogU2FuZGJveCkgPT4ge1xuICBjb25zdCBuYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdmlnYXRpb24tY29udGFpbmVyXCIpXG4gIGlmICghbmF2KSByZXR1cm5cblxuICB3aGlsZSAobmF2LmZpcnN0Q2hpbGQpIHtcbiAgICBuYXYucmVtb3ZlQ2hpbGQobmF2LmZpcnN0Q2hpbGQpXG4gIH1cblxuICBjb25zdCB0aXRsZWg0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImg0XCIpXG4gIHRpdGxlaDQudGV4dENvbnRlbnQgPSB0aXRsZVxuICBuYXYuYXBwZW5kQ2hpbGQodGl0bGVoNClcblxuICAvLyBNYWtlIGFsbCB0aGUgc2lkZWJhciBlbGVtZW50c1xuICBjb25zdCB1bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKVxuICBzdG9yeUNvbnRlbnQuZm9yRWFjaCgoZWxlbWVudDogU3RvcnlDb250ZW50LCBpOiBudW1iZXIpID0+IHtcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgIHN3aXRjaCAoZWxlbWVudC50eXBlKSB7XG4gICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgY2FzZSBcImhyZWZcIjpcbiAgICAgIGNhc2UgXCJjb2RlXCI6IHtcbiAgICAgICAgbGkuY2xhc3NMaXN0LmFkZChcInNlbGVjdGFibGVcIilcbiAgICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpXG5cbiAgICAgICAgbGV0IGxvZ286IHN0cmluZ1xuICAgICAgICBpZiAoZWxlbWVudC50eXBlID09PSBcImNvZGVcIikge1xuICAgICAgICAgIGxvZ28gPSBgPHN2ZyB3aWR0aD1cIjdcIiBoZWlnaHQ9XCI3XCIgdmlld0JveD1cIjAgMCA3IDdcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj48cmVjdCB3aWR0aD1cIjdcIiBoZWlnaHQ9XCI3XCIgZmlsbD1cIiMxODdBQkZcIi8+PC9zdmc+YFxuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQudHlwZSA9PT0gXCJodG1sXCIpIHtcbiAgICAgICAgICBsb2dvID0gYDxzdmcgd2lkdGg9XCI5XCIgaGVpZ2h0PVwiMTFcIiB2aWV3Qm94PVwiMCAwIDkgMTFcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj48cGF0aCBkPVwiTTggNS41VjMuMjVMNiAxSDRNOCA1LjVWMTBIMVYxSDRNOCA1LjVINFYxXCIgc3Ryb2tlPVwiI0M0QzRDNFwiLz48L3N2Zz5gXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9nbyA9IFwiXCJcbiAgICAgICAgfVxuXG4gICAgICAgIGEuaW5uZXJIVE1MID0gYCR7bG9nb30ke2VsZW1lbnQudGl0bGV9YFxuICAgICAgICBhLmhyZWYgPSBgL3BsYXkjJHtwcmVmaXh9LSR7aX1gXG5cbiAgICAgICAgYS5vbmNsaWNrID0gZSA9PiB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgICAgICAvLyBOb3RlOiBJJ20gbm90IHN1cmUgd2h5IHRoaXMgaXMgbmVlZGVkP1xuICAgICAgICAgIGNvbnN0IGVkID0gc2FuZGJveC5lZGl0b3IuZ2V0RG9tTm9kZSgpXG4gICAgICAgICAgaWYgKCFlZCkgcmV0dXJuXG4gICAgICAgICAgc2FuZGJveC5lZGl0b3IudXBkYXRlT3B0aW9ucyh7IHJlYWRPbmx5OiBmYWxzZSB9KVxuXG4gICAgICAgICAgY29uc3QgYWxyZWFkeVNlbGVjdGVkID0gdWwucXVlcnlTZWxlY3RvcihcIi5zZWxlY3RlZFwiKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgIGlmIChhbHJlYWR5U2VsZWN0ZWQpIGFscmVhZHlTZWxlY3RlZC5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIilcblxuICAgICAgICAgIGxpLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKVxuICAgICAgICAgIHN3aXRjaCAoZWxlbWVudC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiY29kZVwiOlxuICAgICAgICAgICAgICBzZXRDb2RlKGVsZW1lbnQuY29kZSwgc2FuZGJveClcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgICAgICAgICBzZXRTdG9yeShlbGVtZW50Lmh0bWwsIHNhbmRib3gpXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImhyZWZcIjpcbiAgICAgICAgICAgICAgc2V0U3RvcnlWaWFIcmVmKGVsZW1lbnQuaHJlZiwgc2FuZGJveClcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2V0IHRoZSBVUkwgYWZ0ZXIgc2VsZWN0aW5nXG4gICAgICAgICAgY29uc3QgYWx3YXlzVXBkYXRlVVJMID0gIWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZGlzYWJsZS1zYXZlLW9uLXR5cGVcIilcbiAgICAgICAgICBpZiAoYWx3YXlzVXBkYXRlVVJMKSB7XG4gICAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gYCR7cHJlZml4fS0ke2l9YFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBsaS5hcHBlbmRDaGlsZChhKVxuXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlIFwiaHJcIjoge1xuICAgICAgICBjb25zdCBociA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoclwiKVxuICAgICAgICBsaS5hcHBlbmRDaGlsZChocilcbiAgICAgIH1cbiAgICB9XG4gICAgdWwuYXBwZW5kQ2hpbGQobGkpXG4gIH0pXG4gIG5hdi5hcHBlbmRDaGlsZCh1bClcblxuICBjb25zdCBwYWdlSUQgPSBsb2NhdGlvbi5oYXNoLnNwbGl0KFwiLVwiKVsxXSB8fCBcIlwiXG4gIGNvbnN0IGluZGV4ID0gTnVtYmVyKHBhZ2VJRCkgfHwgMFxuXG4gIGNvbnN0IHRhcmdldGVkTGkgPSB1bC5jaGlsZHJlbi5pdGVtKGluZGV4KSB8fCB1bC5jaGlsZHJlbi5pdGVtKDApXG4gIGlmICh0YXJnZXRlZExpKSB7XG4gICAgY29uc3QgYSA9IHRhcmdldGVkTGkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhXCIpLml0ZW0oMClcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKGEpIGEuY2xpY2soKVxuICB9XG59XG5cbi8vIFVzZSBmZXRjaCB0byBncmFiIHRoZSBIVE1MIGZyb20gYSBVUkwsIHdpdGggYSBzcGVjaWFsIGNhc2UgXG4vLyB3aGVuIHRoYXQgaXMgYSBnYXRzYnkgVVJMIHdoZXJlIHdlIHB1bGwgb3V0IHRoZSBpbXBvcnRhbnRcbi8vIEhUTUwgZnJvbSBpbnNpZGUgdGhlIF9fZ2F0c2J5IGlkLlxuY29uc3Qgc2V0U3RvcnlWaWFIcmVmID0gKGhyZWY6IHN0cmluZywgc2FuZGJveDogU2FuZGJveCkgPT4ge1xuICBmZXRjaChocmVmKS50aGVuKGFzeW5jIHJlcSA9PiB7XG4gICAgaWYgKHJlcS5vaykge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlcS50ZXh0KClcblxuICAgICAgaWYgKHRleHQuaW5jbHVkZXMoXCJfX19nYXRzYnlcIikpIHtcbiAgICAgICAgY29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICAgICAgICBjb25zdCBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHRleHQsIFwidGV4dC9odG1sXCIpO1xuXG4gICAgICAgIGNvbnN0IGdhdHNieSA9IGRvYy5nZXRFbGVtZW50QnlJZCgnX19fZ2F0c2J5JylcbiAgICAgICAgaWYgKGdhdHNieSkge1xuICAgICAgICAgIGdhdHNieS5pZCA9IFwiX19faW5uZXJfZ1wiXG4gICAgICAgICAgc2V0U3RvcnkoZ2F0c2J5LCBzYW5kYm94KVxuICAgICAgICB9XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAoZG9jdW1lbnQubG9jYXRpb24uaG9zdCA9PT0gXCJsb2NhbGhvc3Q6ODAwMFwiKSB7XG4gICAgICAgIHNldFN0b3J5KFwiPHA+QmVjYXVzZSB0aGUgZ2F0c2J5IGRldiBzZXJ2ZXIgdXNlcyBKUyB0byBidWlsZCB5b3VyIHBhZ2VzLCBhbmQgbm90IHN0YXRpY2FsbHksIHRoZSBwYWdlIHdpbGwgbm90IGxvYWQgZHVyaW5nIGRldi4gSXQgZG9lcyB3b3JrIGluIHByb2QgdGhvdWdoIC0gdXNlIDxjb2RlPnlhcm4gYnVpbGQtc2l0ZTwvY29kZT4gdG8gdGVzdCBsb2NhbGx5IHdpdGggYSBzdGF0aWMgYnVpbGQuPC9wPlwiLCBzYW5kYm94KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U3RvcnkodGV4dCwgc2FuZGJveClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2V0U3RvcnkoYDxwPkZhaWxlZCB0byBsb2FkIHRoZSBjb250ZW50IGF0ICR7aHJlZn0uIFJlYXNvbjogJHtyZXEuc3RhdHVzfSAke3JlcS5zdGF0dXNUZXh0fTwvcD5gLCBzYW5kYm94KVxuICAgIH1cbiAgfSlcbn1cblxuLyoqIFxuICogUGFzc2luZyBpbiBlaXRoZXIgYSByb290IEhUTUwgZWxlbWVudCBvciB0aGUgSFRNTCBmb3IgdGhlIHN0b3J5LCBwcmVzZW50IGEgXG4gKiBtYXJrZG93biBkb2MgYXMgYSAnc3RvcnknIGluc2lkZSB0aGUgcGxheWdyb3VuZC5cbiAqL1xuY29uc3Qgc2V0U3RvcnkgPSAoaHRtbDogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIHNhbmRib3g6IFNhbmRib3gpID0+IHtcbiAgY29uc3QgdG9vbGJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdG9yLXRvb2xiYXJcIilcbiAgaWYgKHRvb2xiYXIpIHRvb2xiYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG5cbiAgY29uc3QgbW9uYWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb25hY28tZWRpdG9yLWVtYmVkXCIpXG4gIGlmIChtb25hY28pIG1vbmFjby5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblxuICBjb25zdCBzdG9yeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RvcnktY29udGFpbmVyXCIpXG4gIGlmICghc3RvcnkpIHJldHVyblxuXG4gIHN0b3J5LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCJcbiAgaWYgKHR5cGVvZiBodG1sID09PSBcInN0cmluZ1wiKSB7XG4gICAgc3RvcnkuaW5uZXJIVE1MID0gaHRtbFxuICB9IGVsc2Uge1xuICAgIHdoaWxlIChzdG9yeS5maXJzdENoaWxkKSB7XG4gICAgICBzdG9yeS5yZW1vdmVDaGlsZChzdG9yeS5maXJzdENoaWxkKVxuICAgIH1cbiAgICBzdG9yeS5hcHBlbmRDaGlsZChodG1sKVxuICB9XG5cbiAgLy8gV2UgbmVlZCB0byBoaWphY2sgaW50ZXJuYWwgbGlua3NcbiAgZm9yIChjb25zdCBhIG9mIEFycmF5LmZyb20oc3RvcnkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhXCIpKSkge1xuICAgIGlmICghYS5wYXRobmFtZS5zdGFydHNXaXRoKFwiL3BsYXlcIikpIGNvbnRpbnVlXG4gICAgLy8gTm90ZSB0aGUgdGhlIGhlYWRlciBnZW5lcmF0ZWQgbGlua3MgYWxzbyBjb3VudCBpbiBoZXJlXG5cbiAgICAvLyBvdmVyd3JpdGUgcGxheWdyb3VuZCBsaW5rc1xuICAgIGlmIChhLmhhc2guaW5jbHVkZXMoXCIjY29kZS9cIikpIHtcbiAgICAgIGEub25jbGljayA9IGUgPT4ge1xuICAgICAgICBjb25zdCBjb2RlID0gYS5oYXNoLnJlcGxhY2UoXCIjY29kZS9cIiwgXCJcIikudHJpbSgpXG4gICAgICAgIGxldCB1c2VyQ29kZSA9IHNhbmRib3gubHpzdHJpbmcuZGVjb21wcmVzc0Zyb21FbmNvZGVkVVJJQ29tcG9uZW50KGNvZGUpXG4gICAgICAgIC8vIEZhbGxiYWNrIGluY2FzZSB0aGVyZSBpcyBhbiBleHRyYSBsZXZlbCBvZiBkZWNvZGluZzpcbiAgICAgICAgLy8gaHR0cHM6Ly9naXR0ZXIuaW0vTWljcm9zb2Z0L1R5cGVTY3JpcHQ/YXQ9NWRjNDc4YWI5YzM5ODIxNTA5ZmYxODlhXG4gICAgICAgIGlmICghdXNlckNvZGUpIHVzZXJDb2RlID0gc2FuZGJveC5senN0cmluZy5kZWNvbXByZXNzRnJvbUVuY29kZWRVUklDb21wb25lbnQoZGVjb2RlVVJJQ29tcG9uZW50KGNvZGUpKVxuICAgICAgICBpZiAodXNlckNvZGUpIHNldENvZGUodXNlckNvZGUsIHNhbmRib3gpXG5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgICAgY29uc3QgYWxyZWFkeVNlbGVjdGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZpZ2F0aW9uLWNvbnRhaW5lclwiKSEucXVlcnlTZWxlY3RvcihcImxpLnNlbGVjdGVkXCIpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgIGlmIChhbHJlYWR5U2VsZWN0ZWQpIGFscmVhZHlTZWxlY3RlZC5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIilcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gb3ZlcndyaXRlIGdpc3QvaGFuZGJvb2sgbGlua3NcbiAgICBlbHNlIGlmIChhLmhhc2guaW5jbHVkZXMoXCIjZ2lzdC9cIikgfHwgYS5oYXNoLmluY2x1ZGVzKFwiI2hhbmRib29rXCIpKSB7XG4gICAgICBhLm9uY2xpY2sgPSBlID0+IHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBOdW1iZXIoYS5oYXNoLnNwbGl0KFwiLVwiKVsxXSlcbiAgICAgICAgY29uc3QgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZpZ2F0aW9uLWNvbnRhaW5lclwiKVxuICAgICAgICBpZiAoIW5hdikgcmV0dXJuXG4gICAgICAgIGNvbnN0IHVsID0gbmF2LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidWxcIikuaXRlbSgwKSFcblxuICAgICAgICBjb25zdCB0YXJnZXRlZExpID0gdWwuY2hpbGRyZW4uaXRlbShOdW1iZXIoaW5kZXgpIHx8IDApIHx8IHVsLmNoaWxkcmVuLml0ZW0oMClcbiAgICAgICAgaWYgKHRhcmdldGVkTGkpIHtcbiAgICAgICAgICBjb25zdCBhID0gdGFyZ2V0ZWRMaS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFcIikuaXRlbSgwKVxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBpZiAoYSkgYS5jbGljaygpXG4gICAgICAgIH1cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhLnNldEF0dHJpYnV0ZShcInRhcmdldFwiLCBcIl9ibGFua1wiKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBzaG93Q29kZSA9IChzYW5kYm94OiBTYW5kYm94KSA9PiB7XG4gIGNvbnN0IHN0b3J5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdG9yeS1jb250YWluZXJcIilcbiAgaWYgKHN0b3J5KSBzdG9yeS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblxuICBjb25zdCB0b29sYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0b3ItdG9vbGJhclwiKVxuICBpZiAodG9vbGJhcikgdG9vbGJhci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG5cbiAgY29uc3QgbW9uYWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb25hY28tZWRpdG9yLWVtYmVkXCIpXG4gIGlmIChtb25hY28pIG1vbmFjby5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG5cbiAgc2FuZGJveC5lZGl0b3IubGF5b3V0KClcbn1cblxuY29uc3Qgc2V0Q29kZSA9IChjb2RlOiBzdHJpbmcsIHNhbmRib3g6IFNhbmRib3gpID0+IHtcbiAgc2FuZGJveC5zZXRUZXh0KGNvZGUpXG4gIHNob3dDb2RlKHNhbmRib3gpXG59Il19