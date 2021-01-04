# kiosk
Kiosk Mode Raspberry Pi for Screen Overlay

## To generate transparent WebM videos use the command

```
ffmpeg -framerate 30 -i ~/window-home/frames1.1/ada\ overloay\ type\ 1_00%03d.png  -pix_fmt yuva420p -filter:v "crop=1920:400:0:680,reverse" ./assets/title-anim-out.webm
```

 Remove `,reverse` for the forward direction video.