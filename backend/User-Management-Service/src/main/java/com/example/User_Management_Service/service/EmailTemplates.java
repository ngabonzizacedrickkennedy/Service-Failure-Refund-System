package com.example.User_Management_Service.service;

/**
 * Renders the branded HTML shell used by every transactional email SSFRS sends.
 *
 * Email clients are not browsers: no external stylesheets, no flexbox/grid, no
 * &lt;style&gt; support in Outlook/Gmail-web for layout. Everything here is
 * table-based with inline styles, which is the only combination that renders the
 * same in Gmail, Outlook, Apple Mail and mobile clients.
 *
 * Colours mirror the app's design tokens in frontend/app/globals.css
 * (primary #2D2D2D, accent #2563EB, slate neutrals).
 */
public final class EmailTemplates {

    private EmailTemplates() {
    }

    private static final String ACCENT = "#2563EB";
    private static final String INK = "#0F172A";
    private static final String BODY = "#334155";
    private static final String MUTED = "#64748B";
    private static final String BORDER = "#E2E8F0";

    private static final String LAYOUT = """
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta name="x-apple-disable-message-reformatting">
              <meta name="color-scheme" content="light">
              <meta name="supported-color-schemes" content="light">
              <title>{{heading}}</title>
              <!--[if mso]>
              <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
              <![endif]-->
              <style>
                @media only screen and (max-width:620px) {
                  .sf-card { padding: 28px 22px !important; }
                  .sf-h1 { font-size: 22px !important; }
                  .sf-btn a { display: block !important; }
                }
              </style>
            </head>
            <body style="margin:0;padding:0;width:100%;background-color:#EEF2F7;">
              <div style="display:none;font-size:1px;color:#EEF2F7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">{{preheader}}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EEF2F7;">
                <tr>
                  <td align="center" style="padding:32px 16px;">

                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">

                      <!-- Brand bar -->
                      <tr>
                        <td style="background-color:#1C1F24;border-radius:14px 14px 0 0;padding:26px 32px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="left" style="vertical-align:middle;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="38" height="38" align="center" style="width:38px;height:38px;background-color:{{accent}};border-radius:10px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:700;color:#ffffff;line-height:38px;">S</td>
                                    <td style="padding-left:12px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                                      <div style="font-size:16px;font-weight:600;color:#ffffff;letter-spacing:.3px;line-height:20px;">SSFRS</div>
                                      <div style="font-size:11px;color:#9AA4B2;letter-spacing:.4px;line-height:16px;">Service Failure &amp; Refund System</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Card -->
                      <tr>
                        <td class="sf-card" style="background-color:#ffffff;padding:36px 32px 32px 32px;border-left:1px solid {{border}};border-right:1px solid {{border}};">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <tr>
                              <td style="padding-bottom:6px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:{{accent}};">{{eyebrow}}</td>
                            </tr>
                            <tr>
                              <td class="sf-h1" style="padding-bottom:18px;font-size:25px;line-height:32px;font-weight:700;color:{{ink}};">{{heading}}</td>
                            </tr>
                            <tr>
                              <td>{{body}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color:#F8FAFC;border:1px solid {{border}};border-top:none;border-radius:0 0 14px 14px;padding:22px 32px 26px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                          <p style="margin:0 0 6px 0;font-size:12px;line-height:19px;color:{{muted}};">
                            This is an automated message from the SSFRS platform &mdash; please do not reply to this email.
                          </p>
                          <p style="margin:0;font-size:12px;line-height:19px;color:#94A3B8;">
                            &copy; SSFRS &middot; Service Failure &amp; Refund System
                          </p>
                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

    /**
     * Wraps pre-rendered body HTML in the branded shell.
     *
     * @param preheader short line shown in the inbox preview next to the subject
     * @param eyebrow   small uppercase label above the heading
     * @param heading   the main title
     * @param bodyHtml  content built with the helpers below
     */
    public static String page(String preheader, String eyebrow, String heading, String bodyHtml) {
        return LAYOUT
                .replace("{{preheader}}", escape(preheader))
                .replace("{{eyebrow}}", escape(eyebrow))
                .replace("{{heading}}", escape(heading))
                .replace("{{body}}", bodyHtml)
                .replace("{{accent}}", ACCENT)
                .replace("{{ink}}", INK)
                .replace("{{muted}}", MUTED)
                .replace("{{border}}", BORDER);
    }

    /** A normal body paragraph. Pass already-escaped/allowed inline HTML. */
    public static String paragraph(String html) {
        return "<p style=\"margin:0 0 16px 0;font-size:15px;line-height:24px;color:" + BODY + ";\">" + html + "</p>";
    }

    /** Smaller, muted paragraph — use for fine print under the main content. */
    public static String note(String html) {
        return "<p style=\"margin:0 0 12px 0;font-size:13px;line-height:21px;color:" + MUTED + ";\">" + html + "</p>";
    }

    /** Large, spaced-out one-time code in a dashed box. */
    public static String codeBlock(String code) {
        return """
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px 0;">
                  <tr>
                    <td align="center" style="background-color:#F1F5F9;border:1px dashed #CBD5E1;border-radius:12px;padding:22px 16px;">
                      <div style="font-family:'Courier New',Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:{{ink}};line-height:40px;">{{code}}</div>
                    </td>
                  </tr>
                </table>
                """
                .replace("{{code}}", escape(code))
                .replace("{{ink}}", INK);
    }

    /**
     * Bulletproof-ish CTA button. Outlook renders it square instead of rounded,
     * which is an acceptable degradation.
     */
    public static String button(String label, String url) {
        return """
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="sf-btn" style="margin:6px 0 22px 0;">
                  <tr>
                    <td align="center" bgcolor="{{accent}}" style="background-color:{{accent}};border-radius:10px;">
                      <a href="{{url}}" target="_blank"
                         style="display:inline-block;padding:14px 30px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">{{label}}</a>
                    </td>
                  </tr>
                </table>
                """
                .replace("{{url}}", escapeAttr(url))
                .replace("{{label}}", escape(label))
                .replace("{{accent}}", ACCENT);
    }

    /** The raw link, for clients that strip buttons or users who prefer copy/paste. */
    public static String fallbackLink(String url) {
        return "<p style=\"margin:0 0 4px 0;font-size:12px;line-height:19px;color:" + MUTED + ";\">"
                + "If the button does not work, copy and paste this link into your browser:</p>"
                + "<p style=\"margin:0 0 20px 0;font-size:12px;line-height:19px;word-break:break-all;\">"
                + "<a href=\"" + escapeAttr(url) + "\" style=\"color:" + ACCENT + ";text-decoration:underline;\">"
                + escape(url) + "</a></p>";
    }

    /** Opens a bordered key/value panel. Follow with {@link #row} calls, then {@link #panelEnd}. */
    public static String panelStart() {
        return """
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                       style="margin:4px 0 22px 0;background-color:#F8FAFC;border:1px solid {{border}};border-radius:12px;">
                  <tr><td style="padding:8px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                """.replace("{{border}}", BORDER);
    }

    /** One label/value line inside a panel. Set {@code mono} for codes and passwords. */
    public static String row(String label, String value, boolean mono) {
        String valueFont = mono
                ? "font-family:'Courier New',Consolas,monospace;font-size:15px;letter-spacing:.5px;"
                : "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;";
        return """
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #EDF1F6;">
                    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.7px;text-transform:uppercase;color:{{muted}};padding-bottom:5px;">{{label}}</div>
                    <div style="{{valueFont}}font-weight:600;color:{{ink}};word-break:break-word;">{{value}}</div>
                  </td>
                </tr>
                """
                .replace("{{label}}", escape(label))
                .replace("{{value}}", escape(value))
                .replace("{{valueFont}}", valueFont)
                .replace("{{muted}}", MUTED)
                .replace("{{ink}}", INK);
    }

    public static String panelEnd() {
        return "</table></td></tr></table>";
    }

    /** Coloured advisory strip. {@code tone}: "info", "warning" or "danger". */
    public static String callout(String tone, String html) {
        String bg;
        String bar;
        String fg;
        switch (tone) {
            case "warning" -> { bg = "#FFFBEB"; bar = "#F59E0B"; fg = "#92400E"; }
            case "danger"  -> { bg = "#FEF2F2"; bar = "#EF4444"; fg = "#991B1B"; }
            default        -> { bg = "#EFF6FF"; bar = ACCENT;    fg = "#1E40AF"; }
        }
        return """
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 20px 0;">
                  <tr>
                    <td style="background-color:{{bg}};border-left:4px solid {{bar}};border-radius:8px;padding:14px 18px;
                               font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:21px;color:{{fg}};">{{html}}</td>
                  </tr>
                </table>
                """
                .replace("{{bg}}", bg)
                .replace("{{bar}}", bar)
                .replace("{{fg}}", fg)
                .replace("{{html}}", html);
    }

    /** Preserves the line breaks of free-text the user typed. */
    public static String multiline(String text) {
        return escape(text).replace("\n", "<br>");
    }

    public static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static String escapeAttr(String s) {
        return escape(s).replace("'", "&#39;");
    }
}
