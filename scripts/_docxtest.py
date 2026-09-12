import traceback
try:
    import docx
    import PIL
    d = docx.Document(r'f:\HMAI-Projects\vs code\DocayaDev\docs\Solution Doc\Docaya-Technical-Architecture-Document v1.1.docx')
    print('OK docx', docx.__version__, 'PIL', PIL.__version__, 'paras', len(d.paragraphs))
except Exception:
    traceback.print_exc()
