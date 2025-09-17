import React, { useState } from 'react';

/**
 * A single-file React component that provides a 4-pane layout:
 * 1) Directory Navigation
 * 2) Selected Files
 * 3) Prompt Editor
 * 4) Final Combined Prompt
 */
export default function FileExplorer() {
  // ---------------------------
  // State
  // ---------------------------
  // Holds the handle to the current directory we're viewing
  const [currentDirHandle, setCurrentDirHandle] = useState(null);

  // History stack for navigation (each entry: { dirHandle, name })
  // The top of the stack is the current directory
  const [dirStack, setDirStack] = useState([]);

  // The items (files & subfolders) in the current directory level
  const [entries, setEntries] = useState([]);

  // The list of selected files: each item is { path, content }
  const [selectedFiles, setSelectedFiles] = useState([]);

  // The user’s prompt text
  const [promptText, setPromptText] = useState('Write your prompt here...');

  // The final combined prompt
  const [finalPrompt, setFinalPrompt] = useState('');

  // Potential error messages
  const [error, setError] = useState('');

  // ---------------------------
  // Handlers
  // ---------------------------

  /**
   * Opens a directory picker for the user to select the root folder.
   * Resets navigation stack, sets current directory, shows contents.
   */
  async function handleOpenRootDirectory() {
    try {
      setError('');
      const rootHandle = await window.showDirectoryPicker();
      // Reset the stack with the chosen directory as the top
      setDirStack([{ dirHandle: rootHandle, name: rootHandle.name || 'root' }]);
      setCurrentDirHandle(rootHandle);

      // Read the top-level directory items
      const newEntries = await readImmediateEntries(rootHandle);
      setEntries(newEntries);
    } catch (err) {
      console.error(err);
      setError('Could not open directory (maybe user canceled or API not supported).');
    }
  }

  /**
   * Reads the immediate (non-recursive) entries of a directory handle.
   * Returns an array of { name, kind, handle } objects.
   */
  async function readImmediateEntries(dirHandle) {
    const items = [];
    for await (const [name, handle] of dirHandle.entries()) {
      // We'll just push subfolder handles and file handles,
      // ignoring recursion so we only see "top-level" items.
      items.push({ name, kind: handle.kind, handle });
    }
    // Sort directories first, then files (optional)
    items.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });
    return items;
  }

  /**
   * Navigates into a subfolder.
   *  - Pushes new folder onto the dirStack
   *  - Reads items for that folder
   */
  async function handleOpenSubfolder(dirEntry) {
    try {
      const newDirHandle = dirEntry.handle;
      const newDirStack = [...dirStack, { dirHandle: newDirHandle, name: dirEntry.name }];
      setDirStack(newDirStack);
      setCurrentDirHandle(newDirHandle);

      const newEntries = await readImmediateEntries(newDirHandle);
      setEntries(newEntries);
    } catch (err) {
      console.error(err);
      setError('Error reading subfolder.');
    }
  }

  /**
   * Goes up one level in the dirStack (if possible).
   */
  async function handleGoUp() {
    if (dirStack.length <= 1) {
      // Already at root, can’t go up further
      return;
    }
    // Pop the current directory off the stack
    const newStack = [...dirStack];
    newStack.pop(); // remove top
    const parent = newStack[newStack.length - 1];
    setDirStack(newStack);
    setCurrentDirHandle(parent.dirHandle);

    // Read parent directory’s contents again
    const parentEntries = await readImmediateEntries(parent.dirHandle);
    setEntries(parentEntries);
  }

  /**
   * When the user clicks a file, add it to "selectedFiles" if not already there.
   * Also read its contents.
   */
  async function handleSelectFile(fileEntry) {
    try {
      // Check if file already selected
      const existing = selectedFiles.find(f => f.path === getFullPath());
      if (existing) {
        alert('File is already selected.');
        return;
      }
      // Read the file content
      const fileHandle = fileEntry.handle;
      const fileObj = await fileHandle.getFile();
      const content = await fileObj.text();

      // Generate a "full path" style string, or just use file name
      const pathString = getFullPath();

      // Add to selected files
      setSelectedFiles(prev => [...prev, { path: pathString, content }]);

      function getFullPath() {
        // Construct something like "dir1/dir2/filename"
        const dirs = dirStack.map(d => d.name); // array of directory names
        // The current file name is fileEntry.name
        // e.g. [root, subfolder1, subfolder2] => "root/subfolder1/subfolder2/file.js"
        // If you want to omit "root", you can slice or rename it.
        return [...dirs.slice(1), fileEntry.name].join('/');
      }
    } catch (err) {
      console.error(err);
      setError('Could not read file content.');
    }
  }

  /**
   * Removes a file from the selected list.
   */
  function handleRemoveSelected(filePath) {
    setSelectedFiles(prev => prev.filter(f => f.path !== filePath));
  }

  /**
   * Combines the user’s prompt text with all selected file contents into finalPrompt.
   */
  function handleBuildFinalPrompt() {
    let combined = promptText;
    for (const file of selectedFiles) {
      combined += `\n\n--- File: ${file.path} ---\n${file.content}`;
    }
    setFinalPrompt(combined);
  }

  /**
   * Copies the finalPrompt to the clipboard.
   */
  function handleCopyFinalPrompt() {
    navigator.clipboard.writeText(finalPrompt).then(() => {
      alert('Final prompt copied to clipboard!');
    });
  }

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'sans-serif' }}>
      <h1 style={{ margin: '1rem' }}>4-Pane Code + Prompt Tool</h1>
      {error && <div style={{ color: 'red', marginLeft: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Pane 1: Navigation */}
        <div style={{ flex: '1', borderRight: '1px solid #ccc', padding: '0.5rem', overflowY: 'auto' }}>
          <h3>Navigation</h3>
          <button onClick={handleOpenRootDirectory}>Open Root Folder</button>
          <button onClick={handleGoUp} style={{ marginLeft: '0.5rem' }}>
            Go Up
          </button>

          <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            <strong>Path:</strong>{' '}
            {dirStack.map((d, i) => (i === 0 ? d.name : `/${d.name}`)).join('')}
          </div>

          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {entries.map(entry => (
              <li key={entry.name} style={{ marginBottom: '0.5rem' }}>
                {entry.kind === 'directory' ? (
                  <span
                    style={{ color: 'blue', cursor: 'pointer' }}
                    onClick={() => handleOpenSubfolder(entry)}
                  >
                    [DIR] {entry.name}
                  </span>
                ) : (
                  <span
                    style={{ color: 'green', cursor: 'pointer' }}
                    onClick={() => handleSelectFile(entry)}
                  >
                    {entry.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Pane 2: Selected Files */}
        <div style={{ flex: '1', borderRight: '1px solid #ccc', padding: '0.5rem', overflowY: 'auto' }}>
          <h3>Selected Files</h3>
          {selectedFiles.length === 0 && <p>No files selected yet.</p>}
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {selectedFiles.map(file => (
              <li key={file.path} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{file.path}</strong>
                  <button onClick={() => handleRemoveSelected(file.path)} style={{ marginLeft: '0.5rem' }}>
                    Remove
                  </button>
                </div>
                <details style={{ marginTop: '0.3rem' }}>
                  <summary>Show File Contents</summary>
                  <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {file.content}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </div>

        {/* Pane 3: Prompt Editor */}
        <div style={{ flex: '1', borderRight: '1px solid #ccc', padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3>Prompt</h3>
          <textarea
            style={{ flex: 1, width: '100%', minHeight: '200px' }}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />
          <button onClick={handleBuildFinalPrompt} style={{ marginTop: '0.5rem' }}>
            Build Final Prompt
          </button>
        </div>

        {/* Pane 4: Final Combined Prompt */}
        <div style={{ flex: '1', padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3>Final Prompt</h3>
          <textarea
            readOnly
            style={{ flex: 1, width: '100%', minHeight: '200px' }}
            value={finalPrompt}
          />
          <button onClick={handleCopyFinalPrompt} style={{ marginTop: '0.5rem' }}>
            Copy Final Prompt
          </button>
        </div>
      </div>
    </div>
  );
}