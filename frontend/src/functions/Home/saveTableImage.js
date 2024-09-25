import html2canvas from 'html2canvas';

export const saveTableImage = (tableRef, fileName = 'full_timetable.png') => {
  const table = tableRef.current;
  
  // Create a clone of the table
  const clone = table.cloneNode(true);
  
  // Create a wrapper div to hold the clone
  const wrapper = document.createElement('div');
  wrapper.appendChild(clone);
  
  // Set styles on the wrapper to ensure it's sized correctly
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '-9999px';
  wrapper.style.width = `${table.scrollWidth}px`;
  wrapper.style.height = `${table.scrollHeight}px`;
  
  // Set styles on the clone to remove scrolling and show all content
  clone.style.overflow = 'visible';
  clone.style.maxHeight = 'none';
  clone.style.height = 'auto';
  clone.style.width = `${table.scrollWidth}px`;
  
  // Append the wrapper to the body
  document.body.appendChild(wrapper);

  html2canvas(clone, {
    width: table.scrollWidth,
    height: table.scrollHeight,
    scale: 1,
  }).then((canvas) => {
    // Remove the wrapper from the body
    document.body.removeChild(wrapper);

    // Create and trigger download
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
};

export default saveTableImage;