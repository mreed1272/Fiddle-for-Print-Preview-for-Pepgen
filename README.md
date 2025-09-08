I created this as an electron fiddle to try to develop a way to have a print preview for my Pepgen app.

I use the webcontents.printToPdf function to create a pdf buffer which I then display in a second BrowserWindow.  I recreate the pdf on the fly depending on the print options selected in the preview and then send the final pdf buffer to the printer of choice.  

I use the CSS @print media selector to create the header and footer for the print out.
