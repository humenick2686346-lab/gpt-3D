@echo off
setlocal
cd /d "%~dp0"
echo Sakura Dream - Local offline viewer
echo No internet connection is required. Keep this window open. Press Ctrl+C to stop.
powershell.exe -NoLogo -NoProfile -Command "$ErrorActionPreference='Stop'; $file=Join-Path (Get-Location) 'index.html'; if(!(Test-Path -LiteralPath $file)){throw 'Extract the ZIP first. index.html must be beside this launcher.'}; $bytes=[IO.File]::ReadAllBytes($file); $listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0); $listener.Start(); $port=$listener.LocalEndpoint.Port; $url='http://127.0.0.1:'+$port+'/'; Write-Host $url; Start-Process $url; try { while($true){$client=$listener.AcceptTcpClient(); try{$stream=$client.GetStream(); $stream.ReadTimeout=3000; $reader=[IO.StreamReader]::new($stream); $request=$reader.ReadLine(); while($reader.ReadLine()){}; $header=[Text.Encoding]::ASCII.GetBytes(('HTTP/1.1 200 OK'+[char]13+[char]10+'Content-Type: text/html; charset=utf-8'+[char]13+[char]10+'Content-Length: '+$bytes.Length+[char]13+[char]10+'Connection: close'+[char]13+[char]10+[char]13+[char]10)); $stream.Write($header,0,$header.Length); $stream.Write($bytes,0,$bytes.Length); $stream.Flush()}catch{Write-Host 'Request ended.'}finally{$client.Close()}} }finally{$listener.Stop()}"
if errorlevel 1 pause
endlocal
