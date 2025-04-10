import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
import os
import sys
from PIL import Image, ImageTk

def get_resource_path(relative_path):
    """Obtiene la ruta absoluta para recursos, funciona para desarrollo y para PyInstaller"""
    try:
        # PyInstaller crea una carpeta temporal y almacena la ruta en _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

class Styles:
    
    LOGO_PATH = get_resource_path(os.path.join("assets", "iconos", "LOGO.png"))
    ICON_PATH = get_resource_path(os.path.join("assets", "iconos", "icono.ico"))
    # Elegant Color Palette (Soft Lavender and Deep Indigo Theme)
    # Primary Colors
    # COLOR_PRIMARY = "#4A4A8A"       # Deep indigo blue
    # COLOR_PRIMARY_LIGHT = "#6A6AB0" # Softer indigo
    # COLOR_PRIMARY_DARK = "#2A2A5A"  # Deep navy indigo

    # COLOR_SECONDARY = "#4A4A8A"       # Deep indigo blue
    # COLOR_SECONDARY_LIGTH = "#6A6AB0" # Softer indigo
    # COLOR_SECONDARY_DARK = "#2A2A5A"  # Deep navy indigo
    # # Accent Colors
    # COLOR_ACCENT = "#8A6FD3"        # Soft lavender purple
    # COLOR_ACCENT_LIGHT = "#A98EEA"  # Lighter lavender
    # COLOR_ACCENT_DARK = "#7259B3"   # Deep lavender

    # # Neutral Colors
    # COLOR_BACKGROUND = "#F4F4FA"    # Soft off-white
    # COLOR_TEXT = "#2C2C4A"          # Dark navy text
    # COLOR_TEXT_LIGHT = "#4A4A6A"    # Softer navy text
    # COLOR_BORDER = "#BAAED9"        # Soft border color

    # # State Colors
    # COLOR_SUCCESS = "#4CAF50"       # Soft green for success
    # COLOR_ERROR = "#F44336"         # Soft red for errors
    # COLOR_WARNING = "#FF9800"       # Soft orange for warnings
    
        # Elegant Color Palette (Military Green Theme)
    # Primary Colors
    COLOR_PRIMARY = "#4B5320"       # Military green
    COLOR_PRIMARY_LIGHT = "#6E7B41" # Softer military green
    COLOR_PRIMARY_DARK = "#364226"  # Deep forest green

    COLOR_SECONDARY = "#4B5320"       # Military green
    COLOR_SECONDARY_LIGHT = "#6E7B41" # Softer military green
    COLOR_SECONDARY_DARK = "#364226"  # Deep forest green

    # Accent Colors
    COLOR_ACCENT = "#8E9775"        # Soft olive green
    COLOR_ACCENT_LIGHT = "#A7B08C"  # Lighter olive
    COLOR_ACCENT_DARK = "#6C744D"   # Deep olive

    # Neutral Colors
    COLOR_BACKGROUND = "#F5F5F0"    # Soft off-white with a green undertone
    COLOR_TEXT = "#2E2E1F"          # Dark olive text
    COLOR_TEXT_LIGHT = "#4C4C33"    # Softer olive text
    COLOR_BORDER = "#AAB393"        # Subtle border color

    # State Colors
    COLOR_SUCCESS = "#6B8E23"       # Olive green for success
    COLOR_ERROR = "#A52A2A"         # Deep brownish-red for errors
    COLOR_WARNING = "#D2B48C"       # Tan for warnings


    # Fonts with improved typography
    FONT_FAMILY = "Segoe UI"  # Modern, clean font
    FONT = (FONT_FAMILY, 12)
    FONT_BOLD = (FONT_FAMILY, 12, "bold")
    FONT_LARGE = (FONT_FAMILY, 16, "bold")
    FONT_SMALL = (FONT_FAMILY, 10)

    # Alignment and Spacing
    ALIGNMENT_CENTER = "center"
    PADDING = 10
    PADDING_SMALL = 5
    PADDING_LARGE = 15
    
    
    # Splash Screen Specific Styles
    SPLASH_WIDTH = 400
    SPLASH_HEIGHT = 300
    SPLASH_PROGRESS_HEIGHT = 8
    SPLASH_PROGRESS_WIDTH = 250
    
    @staticmethod
    def configure_splash(splash_window):
        """Apply splash screen specific styling"""
        splash_window.configure(background=Styles.COLOR_BACKGROUND)
        splash_window.overrideredirect(True)
        
        # Center splash window
        screen_width = splash_window.winfo_screenwidth()
        screen_height = splash_window.winfo_screenheight()
        x = (screen_width // 2) - (Styles.SPLASH_WIDTH // 2)
        y = (screen_height // 2) - (Styles.SPLASH_HEIGHT // 2)
        splash_window.geometry(f"{Styles.SPLASH_WIDTH}x{Styles.SPLASH_HEIGHT}+{x}+{y}")
    
    @staticmethod
    def get_splash_progress_style():
        """Return style configuration for splash progress bar"""
        return {
            'background': Styles.COLOR_ACCENT,
            'trough_color': "#E0E0E0",
            'border_width': 0,
            'height': Styles.SPLASH_PROGRESS_HEIGHT
        }
    
    @staticmethod
    def get_splash_text_style():
        """Return style configuration for splash text"""
        return {
            'font': Styles.FONT,
            'fill': Styles.COLOR_TEXT
        }
    
    @staticmethod
    def get_splash_percent_style():
        """Return style configuration for percentage text"""
        return {
            'font': (Styles.FONT_FAMILY, 12, "bold"),
            'fill': Styles.COLOR_TEXT
        }

    @staticmethod
    def apply_styles():
        """Apply comprehensive custom styles to ttk widgets"""
        style = ttk.Style()
        style.theme_use("clam")  # Clean, modern theme base

        # Button Styles
        style.configure(
            "Custom.TButton",
            font=Styles.FONT,
            padding=(Styles.PADDING, Styles.PADDING_SMALL),
            foreground=Styles.COLOR_BACKGROUND,
            background=Styles.COLOR_PRIMARY,
            bordercolor=Styles.COLOR_BORDER,
            relief="flat",
            focuscolor=Styles.COLOR_ACCENT_LIGHT
        )
        style.map(
            "Custom.TButton",
            background=[
                ("pressed", Styles.COLOR_PRIMARY_DARK), 
                ("active", Styles.COLOR_ACCENT),
                ("disabled", Styles.COLOR_TEXT_LIGHT)
            ],
            foreground=[
                ("pressed", Styles.COLOR_BACKGROUND), 
                ("active", Styles.COLOR_BACKGROUND),
                ("disabled", Styles.COLOR_BACKGROUND)
            ],
            bordercolor=[
                ("pressed", Styles.COLOR_ACCENT_DARK),
                ("active", Styles.COLOR_ACCENT)
            ]
        )
        
        # En styles.py
        style.configure(
            "Danger.TButton", 
            font=Styles.FONT,
            padding=(Styles.PADDING, Styles.PADDING_SMALL),
            foreground=Styles.COLOR_BACKGROUND,
            background=Styles.COLOR_WARNING,
            bordercolor=Styles.COLOR_BORDER,
            relief="flat",
            focuscolor=Styles.COLOR_WARNING
        
        )
        style.map(
            "Danger.TButton", 
            background=[
                ("pressed", Styles.COLOR_ERROR), 
                ("active", Styles.COLOR_ERROR),
                ("disabled", Styles.COLOR_TEXT_LIGHT)
            ],
            foreground=[
                ("pressed", Styles.COLOR_WARNING), 
                ("active", Styles.COLOR_WARNING),
                ("disabled", Styles.COLOR_BACKGROUND)
            ],
            bordercolor=[
                ("pressed", Styles.COLOR_ACCENT_DARK),
                ("active", Styles.COLOR_ACCENT)
            ] # Rojo más oscuro al hacer hover
        )

        # Label Styles
        style.configure(
            "Custom.TLabel",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            padding=Styles.PADDING_SMALL
        )
        
        style.configure(
            "Custom.Header.TLabel",
            font=Styles.FONT_LARGE,
            foreground=Styles.COLOR_PRIMARY_DARK,
            background=Styles.COLOR_BACKGROUND,
            padding=Styles.PADDING
        )
        
        # Configuración del estilo para TLabelframe
        style.configure(
            "Custom.TLabelframe",
            font=Styles.FONT_BOLD,  # Fuente en bold
            foreground=Styles.COLOR_TEXT,                        # Color del texto
            background=Styles.COLOR_BACKGROUND,                  # Fondo principal
            borderwidth=1                                        # Opcional: Borde fino
        )
        


        # Configuración para TLabelframe.Label (los títulos dentro de los Labelframe)
        style.configure(
            "Custom.TLabelframe.Label",
            font=Styles.FONT_BOLD,  # Texto en bold
            foreground=Styles.COLOR_TEXT,                        # Color del texto
            background=Styles.COLOR_BACKGROUND                   # Fondo del título
        )


        # Entry Styles
        style.configure(
            "Custom.TEntry",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            fieldbackground=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            lightcolor=Styles.COLOR_BACKGROUND,
            darkcolor=Styles.COLOR_BACKGROUND,
            padding=(Styles.PADDING_SMALL, Styles.PADDING_SMALL),
            relief="flat"
        )
        style.map(
            "Custom.TEntry",
            bordercolor=[
                ("focus", Styles.COLOR_ACCENT),
                ("!focus", Styles.COLOR_BORDER)
            ],
            lightcolor=[
                ("focus", Styles.COLOR_ACCENT_LIGHT),
                ("!focus", Styles.COLOR_BACKGROUND)
            ]
        )
        # Treeview Styles
        style.configure(
            "Custom.Treeview",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            fieldbackground=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            rowheight=25
        )
        
        # ScrolledText Styles
        style.configure(
            "Custom.TScrolledText",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            fieldbackground=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            lightcolor=Styles.COLOR_BACKGROUND,
            darkcolor=Styles.COLOR_BACKGROUND,
            padding=(Styles.PADDING_SMALL, Styles.PADDING_SMALL),
            relief="flat"
        )

        # Combobox Styles
        style.configure(
            "Custom.TCombobox",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            fieldbackground=Styles.COLOR_BACKGROUND,
            selectbackground=Styles.COLOR_ACCENT_LIGHT,
            selectforeground=Styles.COLOR_TEXT,
            arrowsize=15,
            arrowcolor=Styles.COLOR_TEXT,
            padding=(Styles.PADDING_SMALL, Styles.PADDING_SMALL)
        )
        style.map(
            "Custom.TCombobox",
            fieldbackground=[("readonly", Styles.COLOR_BACKGROUND)],
            selectbackground=[("readonly", Styles.COLOR_ACCENT_LIGHT)],
            background=[("readonly", Styles.COLOR_BACKGROUND)]
        )

        # Frame Styles
        style.configure(
            "Custom.TFrame",
            background=Styles.COLOR_BACKGROUND,
            relief="flat",
            bordercolor=Styles.COLOR_BORDER
        )
        
        style.configure(
            "Custom.Border.TFrame",
            background=Styles.COLOR_BORDER,
            relief="flat"
        )

        # Scrollbar Styles
        style.configure(
            "Custom.Vertical.TScrollbar",
            background=Styles.COLOR_PRIMARY_LIGHT,
            arrowcolor=Styles.COLOR_TEXT,
            troughcolor=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            gripcount=0,
            arrowsize=15
        )
        
        style.configure(
            "Custom.Horizontal.TScrollbar",
            background=Styles.COLOR_PRIMARY_LIGHT,
            arrowcolor=Styles.COLOR_TEXT,
            troughcolor=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            gripcount=0,
            arrowsize=15
        )
        
        style.map(
            "Custom.Vertical.TScrollbar",
            background=[("active", Styles.COLOR_ACCENT)],
            arrowcolor=[("active", Styles.COLOR_BACKGROUND)]
        )
        
        style.map(
            "Custom.Horizontal.TScrollbar",
            background=[("active", Styles.COLOR_ACCENT)],
            arrowcolor=[("active", Styles.COLOR_BACKGROUND)]
        )

        # Notebook Styles (Tabs)
        style.configure(
            "Custom.TNotebook",
            background=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            tabmargins=(2, 2, 2, 0)
        )
        
        style.configure(
            "Custom.TNotebook.Tab",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT_LIGHT,
            background=Styles.COLOR_BACKGROUND,
            padding=(Styles.PADDING, Styles.PADDING_SMALL),
            focuscolor=Styles.COLOR_ACCENT_LIGHT
        )
        style.map(
            "Custom.TNotebook.Tab",
            background=[
                ("selected", Styles.COLOR_PRIMARY_LIGHT),
                ("active", Styles.COLOR_ACCENT_LIGHT)
            ],
            foreground=[
                ("selected", Styles.COLOR_BACKGROUND),
                ("active", Styles.COLOR_TEXT)
            ],
            expand=[("selected", (1, 1, 1, 0))]
        )

        # Treeview Styles
        style.configure(
            "Custom.Treeview",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            fieldbackground=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            rowheight=25
        )
        
        style.configure(
            "Custom.Treeview.Heading",
            font=Styles.FONT_BOLD,
            foreground=Styles.COLOR_BACKGROUND,
            background=Styles.COLOR_PRIMARY,
            relief="flat",
            padding=(Styles.PADDING_SMALL, Styles.PADDING_SMALL)
        )
        
        style.map(
            "Custom.Treeview.Heading",
            background=[
                ("active", Styles.COLOR_ACCENT),
                ("pressed", Styles.COLOR_ACCENT_DARK)
            ]
        )
        
        style.map(
            "Custom.Treeview",
            background=[
                ("selected", Styles.COLOR_ACCENT_LIGHT)
            ],
            foreground=[
                ("selected", Styles.COLOR_TEXT)
            ]
        )

        # Progressbar Styles
        style.configure(
            "Custom.Horizontal.TProgressbar",
            background=Styles.COLOR_ACCENT,
            troughcolor=Styles.COLOR_BACKGROUND,
            bordercolor=Styles.COLOR_BORDER,
            lightcolor=Styles.COLOR_ACCENT_LIGHT,
            darkcolor=Styles.COLOR_ACCENT_DARK,
            thickness=20
        )

        # Checkbutton and Radiobutton Styles
        style.configure(
            "Custom.TCheckbutton",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            indicatorcolor=Styles.COLOR_BACKGROUND,
            indicatordiameter=15,
            indicatorrelief="flat",
            padding=Styles.PADDING
        )
        
        style.configure(
            "Custom.TRadiobutton",
            font=Styles.FONT,
            foreground=Styles.COLOR_TEXT,
            background=Styles.COLOR_BACKGROUND,
            indicatorcolor=Styles.COLOR_BACKGROUND,
            indicatordiameter=15,
            indicatorrelief="flat",
            padding=Styles.PADDING
        )
        
        style.map(
            "Custom.TCheckbutton",
            indicatorcolor=[
                ("selected", Styles.COLOR_ACCENT),
                ("!selected", Styles.COLOR_BACKGROUND)
            ],
            background=[("active", Styles.COLOR_BACKGROUND)]
        )
        
        style.map(
            "Custom.TRadiobutton",
            indicatorcolor=[
                ("selected", Styles.COLOR_ACCENT),
                ("!selected", Styles.COLOR_BACKGROUND)
            ],
            background=[("active", Styles.COLOR_BACKGROUND)]
        )

        # Sizegrip Style
        style.configure(
            "Custom.Sizegrip",
            background=Styles.COLOR_PRIMARY_LIGHT
        )

    @staticmethod
    def show_msg(msg, title="Information"):
        """Elegant information message"""
        messagebox.showinfo(title, msg)

    @staticmethod
    def show_msg_error(msg, title="Error"):
        """Elegant error message"""
        messagebox.showerror(title, msg)

    @staticmethod
    def show_msg_warning(msg, title="Warning"):
        """Elegant warning message"""
        messagebox.showwarning(title, msg)

    @staticmethod
    def show_confirm_yes_no(msg, title="Confirmation"):
        """Elegant confirmation dialog"""
        return messagebox.askyesno(title, msg)

    @staticmethod
    def create_custom_style(widget_type, **kwargs):
        """
        Create a custom style for specific widget types
        Example usage:
        Styles.create_custom_style('TButton', background='#ff0000', font=('Arial', 12))
        """
        style = ttk.Style()
        style_name = f'Custom.{widget_type}'
        style.configure(style_name, **kwargs)
        return style_name

    @staticmethod
    def apply_window_style(root):
        """Apply window-level styling"""
        root.configure(background=Styles.COLOR_BACKGROUND)
        try:
            root.iconbitmap(Styles.ICON_PATH)  # Usa la ruta definida en ICON_PATH
        except Exception as e:
            print(f"Error setting window icon: {e}")
        
        # Set window title font and color
        root.option_add('*TkFDialog*foreground', Styles.COLOR_TEXT)
        root.option_add('*TkFDialog*font', Styles.FONT)
        
        # Configure the default focus highlight
        root.option_add('*focusHighlightBackground', Styles.COLOR_BACKGROUND)
        root.option_add('*focusHighlightColor', Styles.COLOR_ACCENT)
        root.option_add('*highlightThickness', 1)
        
        # Configure selection colors
        root.option_add('*selectBackground', Styles.COLOR_ACCENT_LIGHT)
        root.option_add('*selectForeground', Styles.COLOR_TEXT)
        root.option_add('*selectBorderWidth', 0)
        
