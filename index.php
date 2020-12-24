<!DOCTYPE html>
<html lang="ja">
	<head>
		<meta charset="UTF-8">
		<title>demo</title>
		<style>
			h1 
			{
				font-size: 24px;
				color:#cccccc
			}
		</style>

		<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500&family=Noto+Sans+JP:wght@500&family=Noto+Serif+JP:wght@600&display=swap" rel="stylesheet">
		<style>
			h2 
			{
				font-family: 'Noto Serif JP', serif;
			font-size: 22px;
			}
		</style>
	</head>

	<body stype="margin:Opx;overflow:hidden">
		<div>
<!--
			<script type="module" src="023 js three.js simpletext/examples/main.js"></script>
-->
		</div>
		<div align=center>
			<h1>yukizone demo</h1>
		</div>
		<div>
			<h2>
				<?php
					// directory配下のファイル一覽を取得する
					$files = glob("*");
					for ( $i = 0 ; $i < count($files) ; $i++ )
					{
						$path = $files[$i];
						if ( $path == "index.php" ) continue;
						if ( $path == "reject" ) continue;
						echo '<div><a href="' .$path. '" rel="nofollow">' .$path. '</a></div>';
					}
				?>
			</h2>
		</div>


	</body>
</html>

