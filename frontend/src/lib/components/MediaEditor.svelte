<script>
  import { onDestroy, tick } from 'svelte';
  import { Bold, Italic, Underline, CornerDownLeft, RemoveFormatting, ImagePlus, Eye, Pencil, Trash2, Replace } from 'lucide-svelte';
  import { language } from '$lib/localisation/language.svelte.js';
  import { sanitizeMedia, referencedMedia, readMediaFile, MEDIA_IMAGE_LIMIT } from '$lib/media.js';
  let { value, disabled = false, onchange, onbusy = () => {} } = $props();
  let editor = $state();
  let fileInput = $state();
  let preview = $state(false);
  let busy = $state(false);
  let error = $state('');
  let selectedImage = $state('');
  let formats = $state({});
  let range;
  let lastText;
  let lastImages;
  let replacing = false;
  let alive = true;
  let urls = new Map();
  const tools = [
    { command: 'bold', icon: Bold, key: 'mediaTag_b' },
    { command: 'italic', icon: Italic, key: 'mediaTag_i' },
    { command: 'underline', icon: Underline, key: 'mediaTag_u' },
    { command: 'insertLineBreak', icon: CornerDownLeft, key: 'mediaTag_br' },
    { command: 'removeFormat', icon: RemoveFormatting, key: 'mediaClear' }
  ];

  function hydrate() {
    for (const image of editor.querySelectorAll('img[data-asset-id]')) {
      const asset = value.images.find(item => item.id === image.dataset.assetId);
      if (!asset) { image.remove(); continue; }
      if (!urls.has(asset.id)) urls.set(asset.id, URL.createObjectURL(asset.blob));
      image.src = urls.get(asset.id);
      image.alt = asset.name;
      image.draggable = false;
    }
    for (const [id, url] of urls) if (!value.images.some(image => image.id === id)) { URL.revokeObjectURL(url); urls.delete(id); }
  }

  $effect(() => {
    if (!editor) return;
    if (value.text !== lastText || value.images.map(image => image.id).join(',') !== lastImages) {
      editor.innerHTML = sanitizeMedia(value.text, value.images);
      lastText = value.text;
      lastImages = value.images.map(image => image.id).join(',');
      range = null;
      selectedImage = '';
      hydrate();
    }
  });

  function remember() {
    const selection = window.getSelection();
    if (selection?.rangeCount && editor?.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      range = selection.getRangeAt(0).cloneRange();
      formats = Object.fromEntries(['bold', 'italic', 'underline'].map(command => [command, document.queryCommandState(command)]));
    }
  }

  function restore() {
    editor.focus();
    if (range && editor.contains(range.commonAncestorContainer)) {
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    }
  }

  function emit(images = value.images) {
    const text = sanitizeMedia(editor.innerHTML, images);
    const used = referencedMedia(text, images);
    lastText = text;
    lastImages = used.map(image => image.id).join(',');
    onchange({ ...value, text, images: used });
    remember();
  }

  function command(name) {
    if (disabled || busy || preview) return;
    restore();
    // A fixed BR keeps native undo; insertLineBreak itself is not supported by Chromium.
    const changed = name === 'insertLineBreak'
      ? document.execCommand('insertHTML', false, '<br>')
      : document.execCommand(name, false);
    if (!changed) error = 'mediaCommandUnsupported';
    else error = '';
    emit();
  }

  function paste(event) {
    event.preventDefault();
    if (disabled || preview) return;
    const plain = event.clipboardData.getData('text/plain');
    // Paste plain text only, so hostile clipboard HTML never enters the live editor.
    document.execCommand('insertText', false, plain.slice(0, 100000));
    emit();
  }

  async function chooseImage(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || disabled || busy) return;
    if (!replacing && value.images.length >= MEDIA_IMAGE_LIMIT) { error = 'mediaImageCount'; return; }
    busy = true; onbusy(true); error = '';
    try {
      const asset = await readMediaFile(file);
      if (!alive) return;
      const oldImage = replacing ? editor.querySelector('img[data-asset-id="' + selectedImage + '"]') : null;
      const image = document.createElement('img'); image.dataset.assetId = asset.id;
      if (oldImage) oldImage.replaceWith(image);
      else {
        restore();
        const selection = window.getSelection();
        if (selection.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
          const target = selection.getRangeAt(0); target.deleteContents(); target.insertNode(image); target.setStartAfter(image); target.collapse(true);
        } else editor.append(image);
      }
      const images = [...value.images.filter(item => !oldImage || item.id !== selectedImage), asset];
      emit(images);
      await tick(); hydrate(); selectedImage = asset.id;
    } catch (failure) {
      error = ['mediaFileType', 'mediaFileSize', 'mediaDimensions'].includes(failure.message) ? failure.message : 'mediaFileReadFailed';
    }
    finally { busy = false; if (alive) onbusy(false); }
  }

  function removeImage() {
    editor.querySelector('img[data-asset-id="' + selectedImage + '"]')?.remove();
    selectedImage = ''; emit();
  }

  onDestroy(() => { alive = false; for (const url of urls.values()) URL.revokeObjectURL(url); onbusy(false); });
</script>

<svelte:document onselectionchange={remember} />
<div class="media-editor">
  <div class="toolbar" role="toolbar" aria-label={language.t('review.mediaFormatting')}>
    {#each tools as tool}
      <button type="button" data-command={tool.command} disabled={disabled || busy || preview} aria-pressed={!!formats[tool.command]}
        title={language.t('review.' + tool.key)} aria-label={language.t('review.' + tool.key)}
        onpointerdown={event => event.preventDefault()} onclick={() => command(tool.command)}><tool.icon size={17}/></button>
    {/each}
    <span class="divider"></span>
    <button type="button" disabled={disabled || busy || preview} title={language.t('review.mediaAddImage')} aria-label={language.t('review.mediaAddImage')}
      onpointerdown={event => event.preventDefault()} onclick={() => { remember(); replacing = false; fileInput.click(); }}><ImagePlus size={18}/></button>
    {#if selectedImage && !preview}
      <button type="button" disabled={disabled || busy} title={language.t('review.mediaReplaceImage')} aria-label={language.t('review.mediaReplaceImage')} onclick={() => { replacing = true; fileInput.click(); }}><Replace size={17}/></button>
      <button type="button" disabled={disabled || busy} title={language.t('review.mediaDeleteImage')} aria-label={language.t('review.mediaDeleteImage')} onclick={removeImage}><Trash2 size={17}/></button>
    {/if}
    <button type="button" class="preview-button" aria-pressed={preview} title={language.t(preview ? 'review.mediaEdit' : 'review.mediaPreview')} aria-label={language.t(preview ? 'review.mediaEdit' : 'review.mediaPreview')} disabled={busy} onclick={() => preview = !preview}>
      {#if preview}<Pencil size={17}/>{:else}<Eye size={17}/>{/if}
      <span>{language.t(preview ? 'review.mediaEdit' : 'review.mediaPreview')}</span>
    </button>
  </div>
  <input class="file-input" aria-label={language.t('review.mediaAddImage')} type="file" accept="image/png,image/jpeg,image/webp,image/gif" bind:this={fileInput} onchange={chooseImage} disabled={disabled || busy}>
  <div id="media-text" class="canvas" class:preview bind:this={editor} contenteditable={!disabled && !preview && !busy}
    role="textbox" aria-multiline="true" aria-readonly={disabled || preview} aria-label={language.t('ui.pult.media.fields.message')} tabindex="0"
    oninput={() => emit()} onpaste={paste} ondrop={event => event.preventDefault()}
    onclick={event => { selectedImage = event.target.closest('img[data-asset-id]')?.dataset.assetId ?? ''; remember(); }} onkeyup={remember}></div>
</div>
<p class="media-hint">{language.t('review.mediaLimits')}</p>
{#if busy}<p class="media-hint" role="status">{language.t('review.mediaLoading')}</p>{/if}
{#if error}<p class="media-error" role="alert">{language.t('review.' + error)}</p>{/if}

<style>
  .media-editor { border: 1px solid #cbd5e1; border-radius: 9px; overflow: hidden; background: white; min-width: 0; }
  .toolbar { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; padding: 6px; background: #f1f5f9; border-bottom: 1px solid #dbe2ea; }
  .toolbar button { display: inline-flex; gap: 5px; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 6px; border: 1px solid transparent; border-radius: 5px; color: #334155; background: transparent; cursor: pointer; font: 12px inherit; }
  .toolbar button:hover:not(:disabled), .toolbar button[aria-pressed=true] { background: #e0f2fe; color: #0369a1; border-color: #7dd3fc; }
  .toolbar button:disabled { opacity: .4; cursor: not-allowed; }
  button:focus-visible, .canvas:focus-visible { outline: 2px solid #0ea5e9; outline-offset: -2px; }
  .divider { height: 22px; width: 1px; background: #cbd5e1; margin: 0 3px; }
  .toolbar .preview-button { margin-left: auto; }
  .canvas { background: white; color: #0f172a; min-height: 220px; max-height: 50dvh; overflow: auto; padding: 14px; font: 15px/1.55 Arial,sans-serif; white-space: pre-wrap; overflow-wrap: anywhere; outline: none; }
  .canvas :global(img) { max-width: 100%; height: auto; max-height: 360px; object-fit: contain; cursor: pointer; }
  .canvas :global(img:hover) { outline: 2px solid #38bdf8; }
  .canvas :global(p) { margin: 0 0 8px; }
  .canvas.preview { background: #fafcff; }
  .file-input { display: none; }
  .media-hint { margin: 7px 0 0; color: var(--text-muted); font-size: 12px; line-height: 1.5; }
  .media-error { color: var(--accent-red); font-size: 13px; }
  @media(max-width:600px) { .toolbar button { min-height: 38px; min-width: 36px; } .canvas { padding: 10px; min-height: 190px; } }
  @media(max-width:430px) { .preview-button span { display: none; } }
</style>
