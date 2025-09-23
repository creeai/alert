@echo off
echo Fazendo deploy para GitHub...
git add .
git commit -m "Deploy: Telegram n8n Bridge"
git push origin master
echo Deploy concluido!
pause
