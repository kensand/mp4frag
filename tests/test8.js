'use strict';

console.time('=====> test8.js');

const assert = require('assert');

const Mp4Frag = require('../index');

const ffmpegPath = require('../lib/ffmpeg');

const { spawn } = require('child_process');

const count = 1; //expected count of segments

const frames = 1;

const fps = 24; //number of frames per second(same as input video) might not be necessary

const scale = 640; //used as width of video, height will automatically scale

let counter = 0;

const params = [
  /* log info to console */
  '-loglevel',
  'quiet',
  '-stats',

  /* use hardware acceleration if available */
  '-hwaccel',
  'auto',

  /* use an artificial video input */
  //'-re',
  '-i',
  `${__dirname}/in/BigBuckBunny63MB.mp4`,

  /* set output flags */
  //'-an',
  '-c:a',
  'aac',
  '-c:v',
  'libx264',
  '-movflags',
  '+faststart+frag_keyframe+empty_moov+default_base_moof+omit_tfhd_offset',
  '-f',
  'mp4',
  '-vf',
  `fps=${fps},scale=${scale}:-1,format=yuv420p`,
  '-profile:v',
  'main',
  '-level',
  '3.1',
  '-crf',
  '25',
  '-metadata',
  'title=test mp4',
  '-reset_timestamps',
  '1',
  '-frag_duration',
  '3000000', //make ffmpeg create segments that are 3 seconds duration
  '-min_frag_duration',
  '3000000', //make ffmpeg create segments that are 3 seconds duration
  '-frames',
  frames,
  'pipe:1',
];

const mp4frag = new Mp4Frag({ hlsPlaylistBase: 'test_Name' });

mp4frag.once('initialized', data => {
  assert(mp4frag.m3u8 === `#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-TARGETDURATION:1\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-MAP:URI="init-test_Name.mp4"\n`, 'Unexpected m3u8 data');
});

mp4frag.on('segment', data => {
  counter++;
});

mp4frag.once('error', data => {
  //error is expected when ffmpeg exits without unpiping
  console.log('mp4frag error', data);
});

const ffmpeg = spawn(ffmpegPath, params, { stdio: ['ignore', 'pipe', 'ignore'] });

ffmpeg.once('error', error => {
  console.log('ffmpeg error', error);
});

ffmpeg.once('exit', (code, signal) => {
  assert(counter === count, `${counter} !== ${count}`);
  assert(code === 0, `FFMPEG exited with code ${code} and signal ${signal}`);
  console.timeEnd('=====> test8.js');
});

ffmpeg.stdio[1].pipe(mp4frag);
