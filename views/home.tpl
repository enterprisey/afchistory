<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="utf-8" />
    <title>AfC Review History</title>
    <link href="../static/css/mw.css" rel="stylesheet" />
    <link href="../static/css/afchistory.css" rel="stylesheet" />

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="../static/js/afchistory.js"></script>
    % if defined("user") and get("user"):
    <script>
      $(document).ready(function(){$("#submit").trigger("click")});
    </script>
    % end
  </head>
  <body>
    <h1>Articles for Creation Review History</h1>
    <label for="username">Username:</label>
    <input type="text" id="username" class="mw-ui-input mw-ui-input-inline"\\
           % if defined("user") and get("user"):
           value="{{ user }}"\\
           % end
           />
    <button id="submit" class="mw-ui-button mw-ui-constructive">
      Submit
    </button>
    <br />
    <output id="error" style="display: none;"></output>
    <output id="result" style="display: none;">
      <div id="statistics"></div>
      <table>
        <tr>
          <th>Page</th>
          <th>Timestamp</th>
          <th>Action</th>
        </tr>
      </table>
    </output>
    <br />
    <footer>
      <a href="https://en.wikipedia.org/wiki/User:APerson" title="APerson's user page on the English Wikipedia">APerson</a> (<a href="https://en.wikipedia.org/wiki/User_talk:APerson" title="APerson's talk page on the English Wikipedia">talk!</a>) • <a href="https://github.com/APerson241/afchistory" title="Source code on GitHub">Source code</a> • <a href="https://github.com/APerson241/afchistory/issues" title="Issues on GitHub">Issues</a>
    </footer>
  </body>
</html>
